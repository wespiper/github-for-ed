import { Link } from 'react-router-dom';

export const Landing = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="px-4 py-24 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            GitHub for Writers
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Transform your writing education with version control concepts. 
            Learn, collaborate, and improve your writing skills through structured, 
            process-focused learning.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link 
              to="/register"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
            <Link 
              to="/login"
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Revolutionize Writing Education
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Bring the power of version control to writing education with features 
              designed for both educators and students.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              <div className="bg-white p-6 rounded-lg shadow border">
                <div className="h-8 w-8 bg-blue-100 rounded mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Structured Learning</h3>
                <p className="text-gray-600 text-sm">
                  Multi-stage assignments guide students through the complete writing process,
                  from brainstorming to final revision.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border">
                <div className="h-8 w-8 bg-green-100 rounded mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Version Control</h3>
                <p className="text-gray-600 text-sm">
                  Track every revision, compare versions, and understand the evolution
                  of writing through visual version history.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border">
                <div className="h-8 w-8 bg-purple-100 rounded mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaboration</h3>
                <p className="text-gray-600 text-sm">
                  Real-time feedback, peer reviews, and collaborative editing
                  foster a supportive learning community.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow border">
                <div className="h-8 w-8 bg-orange-100 rounded mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Enhanced</h3>
                <p className="text-gray-600 text-sm">
                  Ethical AI integration provides bounded assistance while
                  preserving authentic learning experiences.
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
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to transform your writing education?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Join educators and students who are already experiencing the power of 
              structured, collaborative writing education.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link 
                to="/register"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
              >
                Start Free Today
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};