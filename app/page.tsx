export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFE5F1] via-[#E0F4FF] to-[#F5E6FF]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Header/Nav */}
          <nav className="flex items-center justify-between mb-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#9C47AE] to-[#B968F9] rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-2xl">🎉</span>
              </div>
              <span className="text-3xl font-black text-gray-900">VYBE</span>
            </div>
            <div className="flex gap-4">
              <a 
                href="#download" 
                className="px-6 py-3 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full font-semibold text-gray-900 transition-all hover:scale-105 shadow-md"
              >
                Download
              </a>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full mb-6 shadow-sm">
              <span className="text-sm font-semibold text-purple-700">✨ Plan Together, Vibe Together</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gray-900 mb-6 leading-tight">
              Group Planning
              <br />
              <span className="bg-gradient-to-r from-[#9C47AE] via-[#B968F9] to-[#D896FF] bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-10 max-w-2xl mx-auto font-medium">
              No more endless group chats. Create events, vote democratically, 
              and let the VYBE decide! 🎊
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <a 
                href="#download" 
                className="group relative px-8 py-4 bg-gradient-to-r from-[#9C47AE] via-[#B968F9] to-[#D896FF] rounded-full font-bold text-white text-lg transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 flex items-center gap-2 min-w-[200px] justify-center"
              >
                Get Started
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a 
                href="#features" 
                className="px-8 py-4 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full font-bold text-gray-900 text-lg transition-all hover:scale-105 shadow-md min-w-[200px] text-center"
              >
                Learn More
              </a>
            </div>

            {/* App Preview Mockup */}
            <div className="relative max-w-sm mx-auto">
              <div className="relative bg-white rounded-[3rem] p-3 shadow-2xl">
                <div className="bg-gradient-to-br from-[#FFE5F1] via-[#E0F4FF] to-[#F5E6FF] rounded-[2.5rem] aspect-[9/19] flex items-center justify-center relative overflow-hidden">
                  {/* Mock App Interface */}
                  <div className="absolute inset-0 p-6 flex flex-col">
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-black text-gray-900 mb-2">Friday Night Out</h3>
                      <p className="text-sm text-gray-600">8 friends • Voting Open</p>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">🍕 Pizza Place</span>
                          <span className="text-purple-600 font-bold">5 votes</span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#9C47AE] to-[#B968F9] rounded-full w-5/6"></div>
                        </div>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">🍜 Ramen Bar</span>
                          <span className="text-purple-600 font-bold">3 votes</span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#9C47AE] to-[#B968F9] rounded-full w-3/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-[#9C47AE] to-[#B968F9] bg-clip-text text-transparent">
                Plan the Perfect Hangout
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-[#9C47AE] to-[#B968F9] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30">
                <span className="text-3xl">🗳️</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Democratic Voting</h3>
              <p className="text-gray-700 text-lg">
                Everyone gets a say! Vote on places, dates, and times. The group decides together.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-[#5B9FFF] to-[#B968F9] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">AI-Powered</h3>
              <p className="text-gray-700 text-lg">
                Just tell us what you want to do. Our AI suggests perfect venues and times instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 hover:scale-105 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF5C8D] to-[#B968F9] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Group Chat</h3>
              <p className="text-gray-700 text-lg">
                Keep everyone in the loop. Chat, share, and coordinate all in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gradient-to-br from-[#F3E5F5] via-[#E1F5FE] to-[#FFF3E0] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Planning Made
              <span className="bg-gradient-to-r from-[#9C47AE] to-[#B968F9] bg-clip-text text-transparent"> Effortless</span>
            </h2>
            <p className="text-xl text-gray-700">Just three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#9C47AE] to-[#B968F9] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-black shadow-2xl shadow-purple-500/50">
                1
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Create Event</h3>
              <p className="text-gray-700 text-lg">
                Set up your hangout with AI or manually. Add options for places and times.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#5B9FFF] to-[#B968F9] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-black shadow-2xl shadow-blue-500/50">
                2
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Invite & Vote</h3>
              <p className="text-gray-700 text-lg">
                Share the link. Everyone votes on their favorites. No app required for guests!
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#00D9A3] to-[#5B9FFF] rounded-full flex items-center justify-center mx-auto mb-6 text-white text-3xl font-black shadow-2xl shadow-green-500/50">
                3
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-3">Let VYBE Decide</h3>
              <p className="text-gray-700 text-lg">
                See results in real-time. Finalize when ready. Everyone's happy!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Download CTA */}
      <div id="download" className="bg-gradient-to-r from-[#9C47AE] via-[#B968F9] to-[#D896FF] py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
            Ready to VYBE?
          </h2>
          <p className="text-2xl text-white/90 mb-10 font-medium">
            Join thousands planning amazing hangouts together
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a 
              href="#" 
              className="group px-10 py-5 bg-white hover:bg-gray-50 rounded-full font-black text-purple-700 text-xl transition-all hover:scale-105 shadow-2xl flex items-center gap-3 min-w-[250px] justify-center"
            >
              <span className="text-3xl">📱</span>
              Download App
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>

          <p className="mt-8 text-white/80 text-sm">
            Available on iOS and Android • Coming soon!
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#9C47AE] to-[#B968F9] rounded-xl flex items-center justify-center">
                  <span className="text-xl">🎉</span>
                </div>
                <span className="text-2xl font-black">VYBE</span>
              </div>
              <p className="text-gray-400 max-w-sm">
                Making group planning effortless and fun. No more endless group chats – just create, vote, and vibe!
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="font-bold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#download" className="hover:text-white transition-colors">Download</a></li>
                <li><a href="/share/event/demo" className="hover:text-white transition-colors">Try Demo</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="mailto:hello@vybewithfriends.com" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2025 VYBE. All rights reserved. Made with 💜 for bringing people together.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                𝕏
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                📷
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Add animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
