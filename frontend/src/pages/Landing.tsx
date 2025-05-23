import { Link } from "react-router-dom";

export const Landing = () => {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-ink-900 sm:text-6xl">
                        Scribe Tree
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-ink-600 max-w-2xl mx-auto">
                        Cultivate authentic voices through guided writing
                        journeys. Watch your words grow and flourish in a
                        supportive learning community designed to nurture
                        writing excellence.
                    </p>
                    <div className="mt-10 flex items-center justify-center gap-x-6">
                        <Link
                            to="/register"
                            className="px-6 py-3 bg-forest-600 text-white font-semibold rounded-md hover:bg-forest-700 transition-colors"
                        >
                            Plant Your Words
                        </Link>
                        <Link
                            to="/login"
                            className="px-6 py-3 border border-ink-200 text-ink-700 font-semibold rounded-md hover:bg-forest-50 transition-colors"
                        >
                            Return to Your Tree
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-forest-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                            Cultivate Writing Excellence
                        </h2>
                        <p className="mt-6 text-lg leading-8 text-ink-600">
                            Nurture authentic voices through structured learning
                            experiences that help writers grow from seed ideas
                            to polished prose.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                        <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                            <div className="bg-white p-6 rounded-lg shadow border border-ink-100">
                                <div className="h-8 w-8 bg-forest-100 rounded mb-4"></div>
                                <h3 className="text-lg font-semibold text-ink-900 mb-2">
                                    Guided Growth
                                </h3>
                                <p className="text-ink-600 text-sm">
                                    Multi-stage assignments nurture writers
                                    through each phase of development, from
                                    seedling ideas to flourishing final drafts.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border border-ink-100">
                                <div className="h-8 w-8 bg-branch-100 rounded mb-4"></div>
                                <h3 className="text-lg font-semibold text-ink-900 mb-2">
                                    Writing Evolution
                                </h3>
                                <p className="text-ink-600 text-sm">
                                    Witness the natural progression of ideas as
                                    they branch and grow, creating a rich
                                    history of your writing journey.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border border-ink-100">
                                <div className="h-8 w-8 bg-scribe-100 rounded mb-4"></div>
                                <h3 className="text-lg font-semibold text-ink-900 mb-2">
                                    Community Growth
                                </h3>
                                <p className="text-ink-600 text-sm">
                                    Flourish together through meaningful
                                    feedback and peer support, cultivating a
                                    grove where all voices can grow strong.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow border border-ink-100">
                                <div className="h-8 w-8 bg-highlight-100 rounded mb-4"></div>
                                <h3 className="text-lg font-semibold text-ink-900 mb-2">
                                    AI-Assisted Growth
                                </h3>
                                <p className="text-ink-600 text-sm">
                                    Thoughtful AI integration provides gentle
                                    guidance while preserving the authenticity
                                    of your unique voice.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                            Ready to plant your writing tree?
                        </h2>
                        <p className="mt-6 text-lg leading-8 text-ink-600">
                            Join educators and students who are already
                            nurturing authentic voices and watching their
                            writing flourish in our supportive grove.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                to="/register"
                                className="px-6 py-3 bg-forest-600 text-white font-semibold rounded-md hover:bg-forest-700 transition-colors"
                            >
                                Begin Your Growth
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
