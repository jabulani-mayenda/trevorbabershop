import Link from "next/link";
import { ArrowRight, BarChart3, Shield, Users, Briefcase } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 tracking-tight">BizManager</span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-slate-900">
            Simplifying Business <br /> Management
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track sales, manage employees, and monitor expenses across multiple businesses in one secure platform.
          </p>

          <div className="flex items-center justify-center">
            <Link
              href="/login"
              className="px-8 py-3 rounded-md bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors inline-flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
              title="Real-time Analytics"
              desc="Monitor your business performance with automated profit and loss reports."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6 text-blue-600" />}
              title="Secure Data"
              desc="Role-based access ensures employees only see what they need to see."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-blue-600" />}
              title="Employee Management"
              desc="Track commissions and sales performance for every team member."
            />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          © {new Date().getFullYear()} BizManager. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
