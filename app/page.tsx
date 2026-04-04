import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Q360 AI Demo
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered tools for field service management
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Select your role
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href={ROUTES.MANAGER_DASHBOARD}
              className="group rounded-xl border-2 border-gray-200 bg-white p-8 text-left shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
            >
              <div className="mb-3 text-3xl">&#x1F4CA;</div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                Manager / Dispatcher
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Command center with project health, dispatch queues, sales
                pipeline, and AI-powered insights.
              </p>
            </Link>

            <Link
              href={ROUTES.EMPLOYEE_HOME}
              className="group rounded-xl border-2 border-gray-200 bg-white p-8 text-left shadow-sm transition-all hover:border-green-500 hover:shadow-md"
            >
              <div className="mb-3 text-3xl">&#x1F527;</div>
              <h2 className="text-xl font-semibold text-gray-900 group-hover:text-green-600">
                Technician / CSR
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Personal workspace with assigned dispatches, tasks, time
                tracking, and AI workflow guides.
              </p>
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Powered by Q360 + Gemini AI
        </p>
      </div>
    </div>
  );
}
