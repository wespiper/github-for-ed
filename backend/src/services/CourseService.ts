import { Course } from '../models/Course';
import { User } from '../models/User';
import { CreateCourseInput, UpdateCourseInput } from '@shared/types';
import { Types } from 'mongoose';

export class CourseService {
  /**
   * Create a new course
   */
  static async createCourse(data: CreateCourseInput, instructorId: string): Promise<any> {
    // Validate input data
    this.validateCreateCourseInput(data);
    
    // Verify instructor exists and has proper role
    const instructor = await User.findById(instructorId);
    if (!instructor) {
      throw new Error('Instructor not found');
    }
    
    if (!['educator', 'admin'].includes(instructor.role)) {
      throw new Error('Only educators can create courses');
    }
    
    // Create course
    const course = new Course({
      title: data.title,
      description: data.description,
      subject: data.subject,
      instructor: new Types.ObjectId(instructorId),
      students: [],
      isPublic: data.isPublic || false,
      maxStudents: data.maxStudents,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      settings: {
        allowSelfEnrollment: false,
        requireApprovalToJoin: true,
        allowStudentDiscussions: true,
        gradingScale: 'points',
        ...data.settings
      },
      status: 'draft'
    });
    
    await course.save();
    
    return await Course.findById(course._id)
      .populate('instructor', 'firstName lastName email');
  }
  
  /**
   * Update course information
   */
  static async updateCourse(courseId: string, data: UpdateCourseInput, userId: string): Promise<any> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check permissions
    await this.validateCourseAccess(course, userId);
    
    // Validate dates if provided
    if (data.startDate || data.endDate) {
      this.validateCourseDates(data.startDate, data.endDate);
    }
    
    // Update course
    Object.assign(course, data);
    await course.save();
    
    return await Course.findById(courseId)
      .populate('instructor', 'firstName lastName email')
      .populate('students', 'firstName lastName email');
  }
  
  /**
   * Enroll a student in a course
   */
  static async enrollStudent(courseId: string, studentId: string, enrolledByUserId: string): Promise<void> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }
    
    if (student.role !== 'student') {
      throw new Error('Only students can be enrolled in courses');
    }
    
    // Check enrollment rules
    await this.validateEnrollment(course, student, enrolledByUserId);
    
    // Check if student is already enrolled
    if (course.students.some((id: any) => id.toString() === studentId)) {
      throw new Error('Student is already enrolled in this course');
    }
    
    // Check course capacity
    if (course.maxStudents && course.students.length >= course.maxStudents) {
      throw new Error('Course has reached maximum capacity');
    }
    
    // Enroll student
    course.students.push(new Types.ObjectId(studentId));
    await course.save();
  }
  
  /**
   * Remove a student from a course
   */
  static async unenrollStudent(courseId: string, studentId: string, removedByUserId: string): Promise<void> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check permissions
    await this.validateCourseAccess(course, removedByUserId);
    
    // Remove student
    course.students = course.students.filter((id: any) => id.toString() !== studentId);
    await course.save();
  }
  
  /**
   * Get courses for a user (instructor or student)
   */
  static async getUserCourses(userId: string, userRole: string): Promise<any[]> {
    let courses;
    
    if (userRole === 'educator' || userRole === 'admin') {
      // Get courses where user is instructor
      courses = await Course.find({ instructor: userId })
        .populate('students', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else if (userRole === 'student') {
      // Get courses where user is enrolled
      courses = await Course.find({ students: userId })
        .populate('instructor', 'firstName lastName email')
        .sort({ createdAt: -1 });
    } else {
      throw new Error('Invalid user role');
    }
    
    return courses;
  }
  
  /**
   * Get course details with access control
   */
  static async getCourseDetails(courseId: string, userId: string, userRole: string): Promise<any> {
    const course = await Course.findById(courseId)
      .populate('instructor', 'firstName lastName email')
      .populate('students', 'firstName lastName email');
    
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check access permissions
    const isInstructor = course.instructor._id.toString() === userId;
    const isStudent = course.students.some((student: any) => student._id.toString() === userId);
    const isAdmin = userRole === 'admin';
    
    if (!isInstructor && !isStudent && !isAdmin && !course.isPublic) {
      throw new Error('Access denied to this course');
    }
    
    return course;
  }
  
  /**
   * Publish a course (make it available to students)
   */
  static async publishCourse(courseId: string, userId: string): Promise<any> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    await this.validateCourseAccess(course, userId);
    
    // Validate course is ready for publication
    this.validateCourseForPublication(course);
    
    course.status = 'published';
    await course.save();
    
    return course;
  }
  
  /**
   * Archive a course
   */
  static async archiveCourse(courseId: string, userId: string): Promise<void> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    await this.validateCourseAccess(course, userId);
    
    course.status = 'archived';
    await course.save();
  }
  
  /**
   * Get student progress in a course
   */
  static async getStudentProgress(courseId: string, studentId: string, requesterId: string): Promise<any> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    
    // Check permissions - instructor, admin, or the student themselves
    const isInstructor = course.instructor.toString() === requesterId;
    const isStudent = studentId === requesterId;
    const requester = await User.findById(requesterId);
    const isAdmin = requester?.role === 'admin';
    
    if (!isInstructor && !isStudent && !isAdmin) {
      throw new Error('Access denied');
    }
    
    // Here we would calculate progress based on assignments, submissions, etc.
    // For now, return a placeholder structure
    return {
      studentId,
      courseId,
      overallProgress: 0,
      assignmentsCompleted: 0,
      totalAssignments: 0,
      averageGrade: null,
      lastActivity: null
    };
  }
  
  // Private helper methods
  
  private static validateCreateCourseInput(data: CreateCourseInput): void {
    if (!data.title?.trim()) {
      throw new Error('Course title is required');
    }
    if (!data.description?.trim()) {
      throw new Error('Course description is required');
    }
    if (!data.subject?.trim()) {
      throw new Error('Course subject is required');
    }
    
    if (data.title.length > 200) {
      throw new Error('Course title cannot exceed 200 characters');
    }
    if (data.description.length > 2000) {
      throw new Error('Course description cannot exceed 2000 characters');
    }
    
    this.validateCourseDates(data.startDate, data.endDate);
    
    if (data.maxStudents && (data.maxStudents < 1 || data.maxStudents > 1000)) {
      throw new Error('Maximum students must be between 1 and 1000');
    }
  }
  
  private static validateCourseDates(startDate?: string, endDate?: string): void {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        throw new Error('End date must be after start date');
      }
    }
  }
  
  private static async validateCourseAccess(course: any, userId: string): Promise<void> {
    const isInstructor = course.instructor.toString() === userId;
    
    if (!isInstructor) {
      // Check if user is admin
      const user = await User.findById(userId);
      if (!user || user.role !== 'admin') {
        throw new Error('Only the course instructor can modify this course');
      }
    }
  }
  
  private static async validateEnrollment(course: any, student: any, enrolledByUserId: string): Promise<void> {
    // If self-enrollment is not allowed, check if enrolled by instructor/admin
    if (!course.settings.allowSelfEnrollment && student._id.toString() === enrolledByUserId) {
      throw new Error('Self-enrollment is not allowed for this course');
    }
    
    // If enrolled by someone else, verify they have permission
    if (student._id.toString() !== enrolledByUserId) {
      const isInstructor = course.instructor.toString() === enrolledByUserId;
      const enrolledBy = await User.findById(enrolledByUserId);
      const isAdmin = enrolledBy?.role === 'admin';
      
      if (!isInstructor && !isAdmin) {
        throw new Error('Only instructors can enroll students');
      }
    }
    
    // Check if course is published
    if (course.status !== 'published') {
      throw new Error('Cannot enroll in unpublished course');
    }
  }
  
  private static validateCourseForPublication(course: any): void {
    if (!course.title?.trim()) {
      throw new Error('Course title is required for publication');
    }
    if (!course.description?.trim()) {
      throw new Error('Course description is required for publication');
    }
    if (!course.subject?.trim()) {
      throw new Error('Course subject is required for publication');
    }
  }
}