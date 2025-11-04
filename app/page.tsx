'use client';

export default function Home() {
  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              V
            </div>
            <span className="text-xl font-semibold tracking-tight">VYBE</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">How it works</a>
            <a href="#download" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">Download</a>
          </div>

          <a href="#download" className="hidden sm:inline-block px-6 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition">
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Content */}
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-gray-100 rounded-full mb-8">
              <span className="text-sm font-medium text-gray-700">✨ The smarter way to plan together</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight mb-6 leading-tight">
              Plan together.
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                Decide together.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              No more endless group chats. Create events, vote democratically, and let your group decide. Simple, fair, and fun.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="#download"
                className="w-full sm:w-auto px-8 py-3 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition duration-300 flex items-center justify-center gap-2"
              >
                Download App
                <span className="text-lg">↓</span>
              </a>
              <a 
                href="/share/event/demo"
                className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-gray-900 font-semibold rounded-full hover:bg-gray-200 transition duration-300"
              >
                Try Demo
              </a>
            </div>
          </div>

          {/* Hero Image/Visual */}
          <div className="mt-20 relative">
            <div className="aspect-video bg-gradient-to-br from-purple-100 via-blue-50 to-cyan-50 rounded-3xl overflow-hidden border border-gray-200/50 shadow-2xl">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-6xl opacity-20">📱</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
              Everything you need to plan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make group planning effortless
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-2xl">
                🗳️
              </div>
              <h3 className="text-xl font-semibold mb-3">Democratic Voting</h3>
              <p className="text-gray-600 leading-relaxed">
                Everyone votes on places, dates, and times. The group decides together, not just one person.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-2xl">
                ✨
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Suggestions</h3>
              <p className="text-gray-600 leading-relaxed">
                Tell us what you want to do. Our AI instantly suggests the perfect venues and times.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6 text-2xl">
                💬
              </div>
              <h3 className="text-xl font-semibold mb-3">Group Chat</h3>
              <p className="text-gray-600 leading-relaxed">
                Keep everyone in the loop. Chat, discuss, and coordinate all in one beautiful place.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-2xl">
                📍
              </div>
              <h3 className="text-xl font-semibold mb-3">Location Discovery</h3>
              <p className="text-gray-600 leading-relaxed">
                Find venues near you. Browse, compare, and add options from Google Places instantly.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-2xl">
                🔔
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Notifications</h3>
              <p className="text-gray-600 leading-relaxed">
                Stay updated. Get notified when votes come in or new options are added to events.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200/50 hover:border-gray-300 hover:shadow-lg transition duration-300">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-6 text-2xl">
                🎯
              </div>
              <h3 className="text-xl font-semibold mb-3">Quick Polls</h3>
              <p className="text-gray-600 leading-relaxed">
                In-person voting mode. Pass your phone around and let everyone vote in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
              How it works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to perfect plans
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg">
                  1
                </div>
                <h3 className="text-2xl font-semibold mb-4">Create</h3>
                <p className="text-gray-600 leading-relaxed">
                  Start an event. Choose the type, set a date, and add initial options or let AI suggest them.
                </p>
              </div>
              <div className="hidden md:block absolute top-16 -right-6 w-12 h-1 bg-gray-300"></div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg">
                  2
                </div>
                <h3 className="text-2xl font-semibold mb-4">Invite & Vote</h3>
                <p className="text-gray-600 leading-relaxed">
                  Share the link with friends. Everyone votes on their favorite options. No signup required for guests.
                </p>
              </div>
              <div className="hidden md:block absolute top-16 -right-6 w-12 h-1 bg-gray-300"></div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-cyan-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg">
                  3
                </div>
                <h3 className="text-2xl font-semibold mb-4">Finalize</h3>
                <p className="text-gray-600 leading-relaxed">
                  See the results in real-time. The winner is clear. Everyone's happy with the decision.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent mb-2">
                10K+
              </div>
              <p className="text-gray-600">Active Users</p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                50K+
              </div>
              <p className="text-gray-600">Events Created</p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                500K+
              </div>
              <p className="text-gray-600">Votes Cast</p>
            </div>
            <div>
              <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-cyan-600 to-blue-500 bg-clip-text text-transparent mb-2">
                4.8★
              </div>
              <p className="text-gray-600">App Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="download" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 rounded-3xl overflow-hidden">
          <div className="relative p-12 sm:p-20 text-center text-white">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-6">
              Ready to plan smarter?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed">
              Join thousands of groups making better decisions together. Download VYBE today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a 
                href="#"
                className="w-full sm:w-auto px-8 py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition duration-300 flex items-center justify-center gap-2"
              >
                <span className="text-2xl">🍎</span>
                App Store
              </a>
              <a 
                href="#"
                className="w-full sm:w-auto px-8 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/30 transition duration-300 border border-white/30 flex items-center justify-center gap-2"
              >
                <span className="text-2xl">🤖</span>
                Google Play
              </a>
            </div>

            <p className="mt-8 text-white/70 text-sm">
              Coming soon on iOS and Android
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200/50 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                  V
                </div>
                <span className="font-semibold">VYBE</span>
              </div>
              <p className="text-sm text-gray-600">
                Making group planning effortless. No more endless chats – just create, vote, and vibe.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-gray-900 transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-gray-900 transition">How it works</a></li>
                <li><a href="/share/event/demo" className="hover:text-gray-900 transition">Try Demo</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Terms</a></li>
                <li><a href="mailto:hello@vybewithfriends.com" className="hover:text-gray-900 transition">Contact</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-sm mb-4">Follow</h4>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900 transition">Twitter / X</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">Instagram</a></li>
                <li><a href="#" className="hover:text-gray-900 transition">LinkedIn</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200/50 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>© 2025 VYBE. All rights reserved. Made with 💜 for bringing people together.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-gray-900 transition">Privacy Policy</a>
              <a href="#" className="hover:text-gray-900 transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Smooth scroll behavior */}
      <style>{`
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
