const Fotter = () => {
  return (
    <footer className="w-full bg-white font-inter">

      <div className="max-w-full mx-auto px-16 pt-12 grid grid-cols-4 gap-8">

        <div>
          <h2 className="text-[30px] font-bold leading-tight text-black font-id">
            Connecting Engineers<br />with Massive<br />Projects
          </h2>
        </div>

        <div>
          <p className="text-[22px] font-bold tracking-[0.2em] text-black uppercase mb-4 font-id">
            Company
          </p>
          <ul className="space-y-2">
            {["Explore Projects", "Join as Builder", "Start a Project", "Contact sales"].map((item) => (
              <li key={item}>
                <a href="#" className="text-[18px] text-gray-600 hover:text-black font-id flex items-center gap-1">
                  <span className="text-gray-400">›</span> {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[22px] font-bold tracking-[0.2em] text-black uppercase mb-4 font-id">
            Contact Info
          </p>
          <ul className="space-y-2">
            {[
              "support@tech-engi.com",
              "9086345xx2",
              "Area 51, Siliguri, west Bengal",
              "sales@tech-engi.com",
            ].map((item) => (
              <li key={item} className="text-[18px] text-gray-600 font-id flex items-center gap-1">
                <span className="text-gray-400">›</span> {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[22px] font-bold tracking-[0.2em] text-black uppercase mb-4 font-id">
            Release Letter
          </p>
          <div className="flex flex-col items-end gap-2 mb-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-4 text-[13px] outline-none font-id placeholder-gray-400 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button className="bg-black text-white text-[12px] font-bold px-4 py-2 font-id hover:bg-gray-800 whitespace-nowrap">
              SUBSCRIBE
            </button>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-4 justify-end">
            {/* LinkedIn */}
            <a href="#" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8A8A8A] hover:text-black">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8A8A8A] hover:text-black">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            {/* Facebook */}
            <a href="#" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8A8A8A] hover:text-black">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center items-center">
        <svg viewBox="0 0 1000 190" className="w-full">

          <defs>
            <linearGradient id="grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="200">
              <stop offset="17%" stopColor="#00BBFF" />
              <stop offset="41%" stopColor="#9D00FF" />
              <stop offset="69%" stopColor="#FFAE58" />
            </linearGradient>
          </defs>

          <text
            x="50%"
            y="60%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="1"
            className="text-[130px] font-inter font-semibold tracking-[0.2em]"
          >
            TECH ENGI
          </text>
        </svg>
      </div>

      <div className="bg-gray-100 border-t border-gray-200 font-inter text-[#878787]">
        <div className="mx-auto px-6 py-10 flex items-center justify-between">
          <p className="text-[15px]">© 2026 Tech ENGI</p>
          <p className="text-[15px]">
            Policy • Terms &amp; Conditions • Cookie Policy
          </p>
          <p className="text-[15px]">
            Designed by Arinova Studio
          </p>
        </div>
      </div>

    </footer >
  );
};

export default Fotter;
