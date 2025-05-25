import { useMyCourses } from "@/hooks/useCourses";
import { CourseBrowsePage } from "./CourseBrowsePage";

export const MyCoursesPage = () => {
    // Reuse the course browsing page but focus on user's courses
    return <CourseBrowsePage />;
};