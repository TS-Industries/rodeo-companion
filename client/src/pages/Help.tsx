import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Section {
  icon: string;
  title: string;
  content: { heading: string; steps: string[] }[];
}

const GUIDE_SECTIONS: Section[] = [
  {
    icon: "📅",
    title: "Schedule — Adding Rodeos",
    content: [
      {
        heading: "Create a new rodeo entry",
        steps: [
          "Tap the Schedule tab (calendar icon) at the bottom of the screen.",
          "Tap the gold ★ Add Rodeo button in the top-right corner.",
          "Enter the rodeo name (e.g. 'Cheyenne Frontier Days').",
          "Tap the calendar icon to pick the rodeo date from the calendar picker.",
          "The entry deadline defaults to 14 days before the rodeo date — you can adjust it.",
          "Select the rodeo type: Jackpot, Amateur Rodeo, or Professional Rodeo.",
          "Select your country: 🇺🇸 USA (miles, USD) or 🍁 Canada (km, CAD). This controls all unit conversions throughout the app.",
        ],
      },
      {
        heading: "Choose your disciplines",
        steps: [
          "Under 'Disciplines', tap one or more events you are entering: Barrel Racing, Breakaway Roping, Team Roping, Tie-Down Roping, Bareback, Saddle Bronc, Steer Wrestling, or Bull Riding.",
          "You can select multiple disciplines for the same rodeo — for example, Barrel Racing + Breakaway.",
          "Each selected discipline will get its own separate run-logging section inside the rodeo.",
        ],
      },
      {
        heading: "Set the venue with Google Maps",
        steps: [
          "In the 'Venue' field, start typing the arena or town name.",
          "Google Maps autocomplete will suggest matching venues — tap the one you want.",
          "The venue address is saved and linked to Google Maps for directions.",
          "Add parking notes (e.g. 'Large rig parking on north side, pull-through available') to help with your trailer.",
        ],
      },
      {
        heading: "Entry deadline notifications",
        steps: [
          "The app will remind you when your entry deadline is approaching.",
          "Go to Settings → Notifications to configure how many days before the deadline you want to be reminded.",
          "Make sure notifications are enabled in your phone's Settings for this app.",
        ],
      },
    ],
  },
  {
    icon: "🏆",
    title: "Runs — Logging Your Performance",
    content: [
      {
        heading: "Log a run from the Runs tab",
        steps: [
          "Tap the Runs tab (trophy icon) at the bottom of the screen.",
          "Your rodeos are grouped under 'Upcoming' and 'Past'.",
          "Find the rodeo you competed in and tap 'Log Run'.",
          "Select which discipline this run is for (only the disciplines you entered are shown).",
          "Enter the run date.",
          "For timed events (Barrel Racing, Breakaway, Team Roping, Tie-Down): enter your time in seconds with decimals — e.g. 13.456 means 13 seconds and 456 milliseconds.",
          "If you had a penalty (knocked barrel, barrier break, etc.), enter the penalty seconds separately.",
          "For roughstock events (Bareback, Saddle Bronc, Bull Riding): enter your score out of 100.",
          "Add optional notes about the run.",
        ],
      },
      {
        heading: "Attach a video to your run",
        steps: [
          "When logging a run, tap 'Tap to attach run video' to select a video from your phone.",
          "The video uploads to secure cloud storage and is accessible from any device.",
          "To add a video to an existing run: tap the run card to expand it, then tap 'Add Video'.",
          "Tap the play button (▶) on any video to watch it directly in the app.",
          "Videos are stored in the cloud — they do not use your phone's local storage.",
        ],
      },
      {
        heading: "Understanding your times",
        steps: [
          "The app automatically identifies your best time (marked with ★) for each discipline.",
          "Times with penalties show the raw time + penalty total.",
          "Use the 'All Runs' tab to see every run across all rodeos, filtered by discipline.",
        ],
      },
    ],
  },
  {
    icon: "💰",
    title: "Expenses — Tracking Costs",
    content: [
      {
        heading: "Add expenses to a rodeo",
        steps: [
          "Open any rodeo from the Schedule tab.",
          "Tap the 'Expenses' tab inside the rodeo.",
          "Tap '+ Add' or tap a category shortcut (Fuel, Entry Fee, Food, etc.).",
          "Choose a category: Entry Fee, Fuel, Lodging, Food & Drink, Equipment, Repairs, Vet/Horse Care, or Other.",
          "Enter the amount in dollars (or Canadian dollars if you selected Canada).",
          "Add a description and date, then tap 'Add Expense'.",
        ],
      },
      {
        heading: "Expense categories explained",
        steps: [
          "🏆 Entry Fee — your rodeo entry cost per discipline.",
          "⛽ Fuel — gas/diesel for your truck and trailer.",
          "🏨 Lodging — hotel, motel, or campground fees.",
          "🍔 Food & Drink — meals and snacks on the road.",
          "🪢 Equipment — ropes, tack, gear purchases or repairs.",
          "🔧 Repairs — truck, trailer, or equipment repairs.",
          "🐴 Vet / Horse Care — farrier, vet bills, feed, supplements.",
          "💰 Other — anything that doesn't fit above.",
        ],
      },
      {
        heading: "Trip budget calculator",
        steps: [
          "Every rodeo detail page shows a Trip Budget Calculator.",
          "Enter your fuel price per gallon (USA) or per liter (Canada).",
          "Enter your fuel economy in MPG (USA) or L/100km (Canada).",
          "The calculator shows estimated fuel used and total fuel cost for the trip.",
          "This helps you budget before you leave home.",
        ],
      },
    ],
  },
  {
    icon: "🗺️",
    title: "Trip Planner — Maps & Fuel Stations",
    content: [
      {
        heading: "Plan a route to your rodeo",
        steps: [
          "Tap the Map tab (map pin icon) at the bottom of the screen.",
          "In the 'Start' field, type your starting location — autocomplete will suggest addresses.",
          "Tap '+ Add Stop' to add the rodeo venue or any intermediate stops.",
          "Add as many stops as needed (e.g. Home → Feed Store → Rodeo Grounds).",
          "Toggle 'Round Trip' to automatically add a return leg back to your starting point.",
          "Tap 'Build Route' to calculate the full route and display it on the map.",
        ],
      },
      {
        heading: "Finding fuel stations along the route",
        steps: [
          "After building a route, the app searches for gas stations along your path.",
          "Each station shows its name, address, rating, and open/closed status.",
          "Tap 'Navigate' on any station to open Google Maps navigation directly to that station.",
          "Use the Trip Summary to see total distance, estimated drive time, and fuel cost.",
          "Adjust your MPG/L per 100km and fuel price in the Trip Summary to refine the estimate.",
        ],
      },
      {
        heading: "USA vs Canada units",
        steps: [
          "The app automatically uses miles and USD for US rodeos.",
          "For Canadian rodeos, all distances show in kilometers and costs in CAD.",
          "This is set when you create the rodeo — select 🇺🇸 USA or 🍁 Canada.",
        ],
      },
    ],
  },
  {
    icon: "📊",
    title: "Analytics — Progress & Reports",
    content: [
      {
        heading: "View your performance trends",
        steps: [
          "Tap the Analytics tab (chart icon) at the bottom.",
          "Select a time period: Weekly, Monthly, or Yearly.",
          "The chart shows your times or scores over time for each discipline.",
          "A downward trend in timed events means you're getting faster — great progress!",
          "Use the discipline filter to focus on one event at a time.",
        ],
      },
      {
        heading: "Drill suggestions",
        steps: [
          "Scroll down in the Analytics tab to find 'Drill Suggestions'.",
          "Select a discipline to get AI-powered training drills tailored to that event.",
          "Drills are generated based on common training techniques for each discipline.",
          "Use these as a starting point — always work with your trainer for personalized advice.",
        ],
      },
      {
        heading: "Expense analytics",
        steps: [
          "Tap the 'Expenses' tab in Analytics to see spending trends.",
          "A pie chart shows your spending breakdown by category.",
          "The 'Top Rodeos by Spend' list shows which events cost the most.",
          "Filter by week, month, year, or all time.",
        ],
      },
    ],
  },
  {
    icon: "⚙️",
    title: "Settings & Notifications",
    content: [
      {
        heading: "Configure notifications",
        steps: [
          "Tap the Settings tab (gear icon) at the bottom.",
          "Under 'Notifications', set how many days before an entry deadline you want to be reminded.",
          "You can set multiple reminders (e.g. 7 days and 2 days before).",
          "Make sure your phone's notification permissions are enabled for this app.",
        ],
      },
      {
        heading: "Account & profile",
        steps: [
          "Your profile is linked to your Manus account used to log in.",
          "Tap 'Sign Out' at the bottom of Settings to log out.",
          "All your data is saved to the cloud — you can log in from any device.",
        ],
      },
    ],
  },
  {
    icon: "📱",
    title: "Mobile App Tips",
    content: [
      {
        heading: "Installing on your phone (iOS & Android)",
        steps: [
          "On iPhone (iOS): Open the app in Safari, tap the Share button (box with arrow), then tap 'Add to Home Screen'. The app will appear on your home screen like a native app.",
          "On Android: Open the app in Chrome, tap the three-dot menu, then tap 'Add to Home Screen' or 'Install App'.",
          "Once installed, the app works offline for viewing your saved data.",
          "Videos and maps require an internet connection.",
        ],
      },
      {
        heading: "Video storage",
        steps: [
          "Videos you upload are stored in secure cloud storage — not on your phone.",
          "This means they don't take up space on your device.",
          "You can access your videos from any device by logging in.",
          "To save a video to your phone, open it in the app and use your browser's download option.",
        ],
      },
      {
        heading: "Data & privacy",
        steps: [
          "All your rodeo data, runs, and videos are private to your account.",
          "Data is stored securely in the cloud and backed up automatically.",
          "You can delete any run, expense, or rodeo at any time.",
        ],
      },
    ],
  },
];

function GuideSection({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const [openContent, setOpenContent] = useState<number | null>(null);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid oklch(0.28 0.06 50)" }}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left transition-colors"
        style={{ background: open ? "oklch(0.22 0.05 48)" : "oklch(0.18 0.04 48)" }}
        onClick={() => setOpen(!open)}
      >
        <span className="text-2xl flex-shrink-0">{section.icon}</span>
        <span className="flex-1 font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)" }}>
          {section.title}
        </span>
        {open
          ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.72 0.16 75)" }} />
          : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.52 0.05 60)" }} />}
      </button>

      {open && (
        <div className="divide-y" style={{ borderTop: "1px solid oklch(0.28 0.06 50)", borderColor: "oklch(0.28 0.06 50)" }}>
          {section.content.map((item, idx) => (
            <div key={idx}>
              <button
                className="w-full flex items-center gap-2 px-4 py-3 text-left"
                style={{ background: openContent === idx ? "oklch(0.20 0.05 48)" : "oklch(0.18 0.04 48)" }}
                onClick={() => setOpenContent(openContent === idx ? null : idx)}
              >
                <span className="flex-1 text-sm font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>{item.heading}</span>
                {openContent === idx
                  ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.52 0.05 60)" }} />
                  : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.52 0.05 60)" }} />}
              </button>
              {openContent === idx && (
                <ol className="px-4 pb-4 space-y-2" style={{ background: "oklch(0.16 0.04 48)" }}>
                  {item.steps.map((step, sIdx) => (
                    <li key={sIdx} className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                        style={{ background: "oklch(0.72 0.16 75 / 20%)", color: "oklch(0.72 0.16 75)" }}>
                        {sIdx + 1}
                      </span>
                      <p className="text-sm leading-relaxed" style={{ color: "oklch(0.72 0.08 65)" }}>{step}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Help() {
  return (
    <div className="min-h-screen bg-background page-enter">
      <div className="page-header sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3">
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: "oklch(0.78 0.18 80)", textShadow: "0 0 20px oklch(0.72 0.16 75 / 40%)" }}
          >
            📖 How to Use This App
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.05 60)" }}>
            Step-by-step guide for all features
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-24">
        {/* Quick start banner */}
        <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, oklch(0.72 0.16 75 / 20%), oklch(0.55 0.20 25 / 20%))", border: "1px solid oklch(0.72 0.16 75 / 40%)" }}>
          <p className="text-sm font-bold mb-1" style={{ color: "oklch(0.78 0.18 80)", fontFamily: "'Playfair Display', serif" }}>
            🤠 Quick Start
          </p>
          <ol className="space-y-1">
            {[
              "Sign in with your Manus account",
              "Go to Schedule → Add a rodeo with date, venue & disciplines",
              "After competing → Go to Runs → Log your time or score",
              "Attach a video of your run for review",
              "Check Analytics to track your progress over time",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "oklch(0.72 0.08 65)" }}>
                <span className="font-bold flex-shrink-0" style={{ color: "oklch(0.72 0.16 75)" }}>{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Discipline reference */}
        <div className="rounded-xl p-4" style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.28 0.06 50)" }}>
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "oklch(0.52 0.05 60)" }}>
            Supported Disciplines
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🐎", name: "Barrel Racing", type: "Timed (seconds)" },
              { icon: "🪢", name: "Breakaway Roping", type: "Timed (seconds)" },
              { icon: "🤝", name: "Team Roping", type: "Timed (seconds)" },
              { icon: "🐄", name: "Tie-Down Roping", type: "Timed (seconds)" },
              { icon: "🤠", name: "Bareback", type: "Scored (0–100)" },
              { icon: "🐴", name: "Saddle Bronc", type: "Scored (0–100)" },
              { icon: "💪", name: "Steer Wrestling", type: "Timed (seconds)" },
              { icon: "🐂", name: "Bull Riding", type: "Scored (0–100)" },
            ].map((d) => (
              <div key={d.name} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "oklch(0.22 0.05 48)" }}>
                <span className="text-xl">{d.icon}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "oklch(0.78 0.10 65)" }}>{d.name}</p>
                  <p className="text-xs" style={{ color: "oklch(0.42 0.04 55)" }}>{d.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        {GUIDE_SECTIONS.map((section, idx) => (
          <GuideSection key={idx} section={section} />
        ))}

        {/* Footer note */}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: "oklch(0.42 0.04 55)" }}>
            Rodeo Companion · Built for barrel racers, ropers, and roughstock riders across North America 🤠
          </p>
        </div>
      </div>
    </div>
  );
}
