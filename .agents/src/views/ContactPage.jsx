import { Link } from "react-router-dom";
import { Mail, Phone, MessageSquare, ArrowLeft } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link to="/Settings">
            <div className="flex items-center gap-3">
              <button className="text-gray-600 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
            </div>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contact Support</h1>
          <p className="text-gray-500">Get help from our support team</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <Mail className="mx-auto w-8 h-8 text-blue-500 mb-3" />
            <h3 className="text-gray-900 font-medium">Email</h3>
            <p className="text-gray-500 text-sm">support@azapal.com</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <Phone className="mx-auto w-8 h-8 text-green-500 mb-3" />
            <h3 className="text-gray-900 font-medium">Phone</h3>
            <p className="text-gray-500 text-sm">+1 (555) 123-4567</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
            <MessageSquare className="mx-auto w-8 h-8 text-purple-500 mb-3" />
            <h3 className="text-gray-900 font-medium">Live Chat</h3>
            <p className="text-gray-500 text-sm">Available 24/7</p>
          </div>
        </div>

        <form className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Submit a Support Ticket</h2>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="your@email.com"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Select a category
            </label>
            <select
              name="category"
              id="category"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="tech">Technical Issue</option>
              <option value="billing">Billing Question</option>
              <option value="account">Account Management</option>
              <option value="delivery">Delivery Support</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              name="subject"
              placeholder="Brief description of your issue"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              name="message"
              id="message"
              placeholder="Describe your issue in detail..."
              rows="4"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition"
          >
            Submit Ticket
          </button>
        </form>
      </div>
    </div>
  );
}
