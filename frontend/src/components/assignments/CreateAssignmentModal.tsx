import { useState } from "react";
import { X } from "lucide-react";
import {
    useCreateAssignment,
    type CreateAssignmentData,
} from "@/hooks/useAssignments";
import { useCourses } from "@/hooks/useCourses";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CreateAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateAssignmentModal = ({
    isOpen,
    onClose,
}: CreateAssignmentModalProps) => {
    const [formData, setFormData] = useState<CreateAssignmentData>({
        title: "",
        description: "",
        instructions: "",
        courseId: "",
        type: "individual",
        requirements: {
            minWords: 500,
            maxWords: 2000,
        },
    });

    const createAssignmentMutation = useCreateAssignment();
    const { data: courses } = useCourses();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            alert("Please enter an assignment title");
            return;
        }

        if (!formData.courseId) {
            alert("Please select a course");
            return;
        }

        try {
            await createAssignmentMutation.mutateAsync(formData);
            setFormData({
                title: "",
                description: "",
                instructions: "",
                courseId: "",
                type: "individual",
                requirements: {
                    minWords: 500,
                    maxWords: 2000,
                },
            });
            onClose();
        } catch (error) {
            console.error("Error creating assignment:", error);
            alert("Failed to create assignment. Please try again.");
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        if (name.startsWith("requirements.")) {
            const requirementField = name.split(".")[1];
            setFormData((prev) => ({
                ...prev,
                requirements: {
                    ...prev.requirements,
                    [requirementField]:
                        value === "" ? undefined : Number(value),
                },
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-ink-900">
                        Create New Assignment
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-ink-400 hover:text-ink-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="title"
                                className="block text-sm font-medium text-ink-700 mb-1"
                            >
                                Assignment Title *
                            </label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                                placeholder="e.g. Persuasive Essay on Climate Change"
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="courseId"
                                className="block text-sm font-medium text-ink-700 mb-1"
                            >
                                Course *
                            </label>
                            <Select
                                value={formData.courseId}
                                onValueChange={(value) =>
                                    handleSelectChange("courseId", value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a course..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {courses?.map((course) => (
                                        <SelectItem
                                            key={course._id}
                                            value={course._id}
                                        >
                                            {course.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="type"
                            className="block text-sm font-medium text-ink-700 mb-1"
                        >
                            Assignment Type
                        </label>
                        <Select
                            value={formData.type}
                            onValueChange={(value) =>
                                handleSelectChange(
                                    "type",
                                    value as
                                        | "individual"
                                        | "collaborative"
                                        | "peer-review"
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="individual">
                                    Individual
                                </SelectItem>
                                <SelectItem value="collaborative">
                                    Collaborative
                                </SelectItem>
                                <SelectItem value="peer-review">
                                    Peer Review
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label
                            htmlFor="description"
                            className="block text-sm font-medium text-ink-700 mb-1"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                            placeholder="Brief overview of the assignment..."
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="instructions"
                            className="block text-sm font-medium text-ink-700 mb-1"
                        >
                            Instructions
                        </label>
                        <textarea
                            id="instructions"
                            name="instructions"
                            value={formData.instructions}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                            placeholder="Detailed instructions for students..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="requirements.minWords"
                                className="block text-sm font-medium text-ink-700 mb-1"
                            >
                                Minimum Words
                            </label>
                            <input
                                type="number"
                                id="requirements.minWords"
                                name="requirements.minWords"
                                value={formData.requirements?.minWords || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                                placeholder="e.g. 500"
                                min="0"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="requirements.maxWords"
                                className="block text-sm font-medium text-ink-700 mb-1"
                            >
                                Maximum Words
                            </label>
                            <input
                                type="number"
                                id="requirements.maxWords"
                                name="requirements.maxWords"
                                value={formData.requirements?.maxWords || ""}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-scribe-500 focus:border-scribe-500"
                                placeholder="e.g. 2000"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-ink-300 text-ink-700 rounded-md hover:bg-ink-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createAssignmentMutation.isPending}
                            className="flex-1 px-4 py-2 bg-scribe-600 text-white rounded-md hover:bg-scribe-700 disabled:opacity-50"
                        >
                            {createAssignmentMutation.isPending
                                ? "Creating..."
                                : "Create Assignment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
