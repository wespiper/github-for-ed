import { useParams } from "react-router-dom";

export const EditTemplatePage = () => {
    const { templateId } = useParams<{ templateId: string }>();
    
    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-ink-900 mb-4">Edit Template</h1>
            <p className="text-ink-600 mb-4">Template ID: {templateId}</p>
            <p className="text-ink-500">This page is under construction.</p>
        </div>
    );
};