import { useState, useMemo } from "react";
import { BookOpen, Search, ChevronDown, ChevronUp } from "lucide-react";

const LRA_SECTIONS = [
  {
    title: "Articles of Association & Objects",
    content: "The name of the association is the Lakeland Rodeo Association. The objects of the association are: To organize rodeo contestants for their mutual benefit and protection. To co-operate, in so far as possible, with the management of all rodeos at which members contest. To protect members against unfairness on the part of any rodeo management. To bring about honest advertising by the rodeo association so that the public may rely on the truth of advertised events. To work for the betterment of conditions and of rules governing rodeo events in which the members of the society take part. The operations of the association are to be chiefly carried on in the Dominion of Canada."
  },
  {
    title: "Membership",
    content: "Memberships shall be open to such persons who are connected in any way with rodeos as the executive may decide to admit. All members and local entries shall be subject to all the by-laws, rules and regulations of the association. The annual membership fee will be set by the board of directors. Membership fees must be paid five business days prior to entry day. Each member shall upon payment of his membership dues be given a membership card. Every member of the association in good standing shall be entitled to vote at any general meeting. All new members will be required to sign a claims release before receiving a membership and anyone under eighteen (18) years of age must have ONE PARENT OR GUARDIAN sign also. Members will receive the same card number annually, and in the event of death or retirement, that number will be retired. Members are the only contestants who can compete in an approved rodeo where an entry fee is paid, with the exception of local entries and invited contestants. The Lakeland Rodeo Association will not accept a membership from anyone who is known to be on the suspended list of any other recognized rodeo association. LRA contestants will be admitted free of charge for the performance in which they are competing, upon presentation at the gate of their current LRA membership card. Lakeland Rodeo Association membership will not be sold to anyone holding a PRCA or CPRA card."
  },
  {
    title: "Junior Members",
    content: "All members fifteen (15) years of age as of January 1st of the current year shall be required to pay a junior membership fee. Ages for junior events: fifteen (15) years and under for Junior Barrel Racing; seventeen (17) years and under for Junior Bull Riding; Junior Steer Riding is under fourteen (14) years. Ages are as of January 1st of the current year. A junior contestant will be required to buy a senior membership card if they want their points to count in the major events. Whatever age the contestant is on January 1st will be considered to be his age for the rodeo year. Pee Wee Barrel Racing membership members will be ten (10) years of age and under as of January 1st. A junior contestant turning out of a rodeo that does not notify the LRA office by 1:00 pm on the Tuesday following callback day will be charged double their entry fees. A junior member may enter any senior event on a junior membership until they have won $500, at which time they must buy a full membership."
  },
  {
    title: "Fines & Suspensions - Turn-Out Fines",
    content: "Members and/or contestants will be fined and/or suspended for failure to abide by articles, by-laws and rules of this association. Contestants turning out of a rodeo at position callback after receiving his first preference will be fined $50.00; not receiving his preference will be fined $10.00. Contestants turning out on Friday after receiving his first preference will be fined $100.00; not receiving his first preference will be fined $10.00. Contestants turning out of a rodeo after Tuesday 1PM before the first performance or slack will be fined $100.00 regardless of his preference. A contestant turning out stock while present at the rodeo will be fined $100.00. A turn-out fine will be waived for one (1) week from the turn-out date before a contestant's name appears on the suspended list. Turn-out fine will be waived if a contestant is set up at two LRA rodeos for the same performance without sufficient time to travel between the two. Junior contestants do not pay a turn out fine if they notify the LRA office by Tuesday 1:00 PM before the first performance or slack."
  },
  {
    title: "General Contestant Disqualification",
    content: "Contestants may be disqualified for any of the following offenses: Being under the influence of liquor in the arena. Rowdyism or quarreling in the actual domain of the arena. Mistreatment of stock. Refusing to contest during a paid performance on an animal drawn for him. Not being ready to compete when called upon. Cheating or attempting to cheat. Unnecessary delay in taking stock. Contestants who turn out stock in a second go round or subsequent go-round cannot place in the average of that event nor can he win the All-Around award at the rodeo. All contestants with horses must ride in the Grand Entry if requested to do so by the management. In the timed events, competitor has twenty (20) seconds to nod for his stock after the judge informs him that his stock is ready to be taken, or he will be flagged out."
  },
  {
    title: "Conduct of Rodeo & Approval",
    content: "The rodeo approval fee will be $200.00. There must be at least seven (7) major events held in order to have rodeo approval. The seven major events are: Saddle Bronc, Bareback, Bull Riding, Calf Roping, Team Roping, Ladies Barrel Racing, and Steer Wrestling. Other approved events are Junior Bull Riding, Junior Barrel Racing, Junior Steer Riding, Pee Wee Barrel Racing, Ladies Breakaway, Junior Breakaway, Wild Horse Race, and Wild Cow Milking. The minimum prize money for each major event will be $250 per performance. Minimum prize money for each of the approved junior events will be $50 per rodeo. Entry fees for rodeos with over $2000 added prize money: $100 in senior events. Entry fees for rodeos with under $2000 added: $75. Junior events entry fees: $50 for rodeos with over $500 added; $30 for under $500 added. Pee Wee entry fee: $20. Ambulance must be on the grounds before any performance."
  },
  {
    title: "Points & Championships",
    content: "One (1) point shall be awarded for each dollar of prize money won by the member in approved events at approved rodeos. All-Around championship to be decided on total points won in major events only. To qualify for the All-Around title, the member must place at least twice in each of two (2) major events, excluding Barrel Racing, in the current rodeo year. To qualify for the Finals rodeo in all events (except Junior Steer Riding and Junior Bull Riding), a contestant must have entered and competed in that event at a minimum of ten (10) LRA approved rodeos during the season, 7 of those being LRA mother sanctioned rodeos. The year-end winner plus the winner of the sudden death finals will be eligible to take out their semi-pro card."
  },
  {
    title: "Saddle Bronc Riding",
    content: "Horse to be furnished by the producer. Riding to be done with plain halter, one rope rein and saddle. Saddle must be association saddle. Standard halter must be used unless agreement is made by both contestant and stock contractor. Horses to be saddled in chute. One arm must be free at all times. Saddle bronc riding shall be timed for eight (8) seconds. Any of the following offenses shall disqualify a rider: being bucked off, changing hands on rein, wrapping rein around hand, pulling leather, losing stirrup, touching animal, saddle, rein or rider with free hand, riding with locked rowels. Rigging: 3/4 double-front edge of Dee ring must pull no further back than directly below the center point of swell. Swell Undercut: Not more than two (2) inches. Gullet: Not less than four (4) inches wide at center. Tree: Fork 14 inch side; height 9 inch maximum; gullet 5 3/4 inch wide; cantle 5 inch maximum height, 14 inch maximum width. Cinches must be at least five (5) inches wide."
  },
  {
    title: "Bareback Bronc Riding",
    content: "One hand rigging to be used. Riggings must not be over ten (10) inches in width at hand hold, and not over six (6) inches D ring. No rigging may have metal, fiberglass, or objectionable material underneath. All riggings must have sheepskin or sponge rubber underneath. All cinches must be at least five (5) inches wide. A one (1) inch thick, covered foam, felt or hair pad must be used under bareback riggings at all times. To qualify, rider must have spurs over the break of the shoulders and touching horse when the horse's feet hit the ground first jump out of the chute. Horses will be ridden eight (8) seconds. There will be no tape or any other adhesive material or substance other than dry rosin used on riggings or rider's gloves. Riders may not take any kind of finger tuck or finger wrap. Any of the following offences will disqualify a rider: riding with rowels too sharp in opinion of judges, being bucked off, touching animal or rider with free hand. If rigging comes off horse without breaking, rider is disqualified."
  },
  {
    title: "Bull Riding",
    content: "Bull's horns must be tipped to the size of a loonie. Riding to be done with one hand and loose rope, with or without hand hold; no knots or hitches to prevent rope from falling off bull when rider leaves him. Rope must have bell; no bell means no marking. Bell must be under belly of bull. Rider not to use sharp spurs. No more than two (2) men may be on the chute to pull contestant's rope. Bull must be ridden eight (8) seconds, time to start when animal leaves the chute. Rider will be disqualified for any of the following offences: being bucked off, touching animal with free hand, or using sharp spurs. A fifty ($50) dollar fine will be levied if judges find any sharp instruments causing bulls to be cut. The rider shall not be allowed to reset and repull rope more than two (2) times if animal is standing well in the chute."
  },
  {
    title: "Junior Bull Riding",
    content: "17 years of age and under as of January 1st of that year. Riding to be done with one hand and loose rope; rope must have bell. No more than two (2) men may help pull a contestant's rope. No animal used in the Junior Bull Riding can be hotshotted after contestant sits on animal. Animal must be ridden eight (8) seconds. Rider will be disqualified for: being bucked off; touching the animal with free hand; using sharp spurs; or fouling the animal by holding the gate. It is mandatory for the riders to wear protective vest and helmet while competing in the junior bull riding event. All horns must be tipped back to no less than the size of a loonie. A junior bull rider may enter the open bull riding event until he makes $500 in the open event."
  },
  {
    title: "Junior Steer Riding",
    content: "Contestants must purchase a junior membership and must be fourteen (14) years of age as of January 1st. Riding to be done with one or two hands and loose rope; rope must have a bell. It is mandatory for the riders to wear protective vests and helmet while competing in the junior steer riding event. Steer will be ridden eight (8) seconds. Rider will be disqualified for: being bucked off; touching animal with free hand; using sharp spurs; or fouling animal by holding gate. Suitable cattle will be native cattle."
  },
  {
    title: "Tie Down Roping (Calf Roping)",
    content: "Automatic barrier must be used at all rodeos for tie down roping and there must be a score line. Ropers to receive a no time if they have not caught and tied their calf in thirty (30) seconds. Contestant must dismount, go down rope, and throw calf by hand and cross and tie any three (3) legs in a 3-bone cross tie; calf must remain tied for six (6) seconds. If calf is down when roper reaches it, the calf must be cleared (daylight between calf's body and ground) or let up on his feet and thrown by hand. A bust means a calf is jerked straight over backwards. If roper deliberately or unintentionally busts a calf, he will be liable for a one hundred ($100) fine. A legal tie in the tie down roping will be one complete wrap and a half hitch. Maximum weight of calves: two hundred and seventy-five (275) pounds."
  },
  {
    title: "Steer Wrestling",
    content: "Contestants must furnish own hazer and horses. Only one (1) hazer allowed. Hazer will not render any assistance to contestant while contestant is working on steer. Steer must be caught from horse. If a steer gets loose, dogger may take no more than one (1) step to catch steer. Steer will be considered down only when it is lying flat on its left side or back with all four legs and head straight. A ten (10) second penalty will be assessed in any case in which a flag rules that the dogger's feet touched the ground before the flag line is crossed. Contestants will be allowed only one (1) jump and it must be made within thirty (30) seconds. Steer Wrestling cattle must have horns a minimum of 8 inches from the tip of the horn to the base of the skull."
  },
  {
    title: "Team Roping",
    content: "Each team will be allowed a total of two (2) throws. Roping steers without releasing loop from hand will be considered no catch. Ropers must dally to stop steer. Tie on Rule: Any heeler 55 years old or older as of January 1 of current year may tie on. The length of rope would be 25 feet. A five (5) second penalty will be assessed if only one (1) hind foot is roped. Header must change direction of steer's body before heel(s) are roped. Legal head catches: 1) head or both horns, 2) half a head; 3) around the neck. Both loops must be thrown within thirty (30) seconds, or team will receive no time. Contestant will be flagged out if he does not nod for his stock within twenty (20) seconds. Team roping cattle must be all horned cattle and must have horn wraps."
  },
  {
    title: "Ladies Barrel Racing",
    content: "Ladies Barrel Racing event must be run on a horse ridden by a female contestant. Regulation barrel distances: ninety feet (90') between barrel one and two; one hundred and five feet (105') between barrel one and three and between barrel two and three; sixty feet (60') from barrels one and two to the score line. Barrels to be forty-five (45) gallon size. A five (5) second penalty will be given per run for each barrel knocked over. Disqualification will result from the use of an electronic device as a riding aid during a performance. Either barrel No.1 or barrel No.2 may be taken first, but contestants will be disqualified for not following the cloverleaf pattern. A contestant can change horses during a barrel racing competition. The use of bats and spurs is allowed; however, excessive use of bat prior to, during, or after the race will mean automatic disqualification. A barrel racer will be considered properly attired if she wears western jeans, long sleeved shirt (cuff and collar), western hat or helmet and boots."
  },
  {
    title: "Junior & Pee Wee Barrel Racing",
    content: "Contestants may be girls or boys. Will run under Ladies Barrel Racing Rules. Once a junior barrel racer has won $500 in the Ladies she will have to choose either the ladies or the juniors. Pee Wee Barrel Racing: members will be ten (10) years of age and under as of January 1st. Ages for Junior Barrel Racing: fifteen (15) years and under. Payout for Junior Barrel Racing: If the payout is $599 or less it will be split 40%, 30%, 20%, 10%. If payout is $600 or over, payout split will be 33%, 25%, 18%, 12%, 8%, 4%."
  },
  {
    title: "Breakaway Roping",
    content: "Junior breakaway roper is 14 years and younger as of January 1st. Junior member cannot rope in both the ladies breakaway and junior - must pick one event. No horned cattle in the Breakaway. Horns must not be more than a maximum of 2 inches. Added money will be a minimum of $100 for ladies breakaway, and a minimum of $100 added for Junior breakaway. All cattle for the breakaway will be drawn prior to performance and slack. Ladies and Junior events can be run together but will be paid separately. $25.00 entry for Junior Breakaway ropers, and $75.00 entry for ladies. The rope must be completely around the calf's neck. The rope must breakaway from the saddle horn before the calf enters the catch pen - if it does not, it will result in a No Time."
  },
  {
    title: "Barriers & Scoreline",
    content: "A ten (10) second penalty will be added for breaking or beating the barrier. In all timed events, a barrier will not be considered broken unless the ring drops within ten (10) feet of the post. Barrier equipment must be inspected by the judge before each timed event. If equipment is faulty, it must be replaced. Once score line has been set in timed events, it will not be changed at that rodeo, nor can length of box be changed. In order for time to be considered official, barrier flag must operate. Automatic barriers must be used - no hard fixed barriers will be allowed, only pulley system barriers."
  },
  {
    title: "Humane Treatment of Livestock",
    content: "No locked rowels or rowels that will lock on spurs or sharpened spurs may be used on bareback horses or Saddle Bronc. Locked rowels will be permitted in Bull Riding, Junior Bull Riding, and Steer Riding. If more than one horse falls due to adverse ground conditions, that event will be postponed until arena conditions are improved. A neck rope must be used in the tie down event. The placing of fingers in eyes, lips or nose of steers while wrestling is forbidden. No animals shall be beaten, mutilated or cruelly prodded. Standard electric prods shall be used as little as possible. No sharp or cutting objects in cinch, saddle girth, or flank straps shall be permitted - violation results in a $100.00 fine. Excessive whipping ahead of the shoulders will result in disqualification. No stimulants or hypnotics to be used or given to any animal. All cattle used in the Team Roping event shall be required to have their horns wrapped."
  },
  {
    title: "Finals Rules",
    content: "A contestant that does not have their picture (head and shoulders) in the office by July 31 of each year for the finals program will be fined $100. Turning out of any performance after entry at the finals will result in a $1000 fine. The finalist in each of the seven major events will compete over the five go-rounds with an average. The contestants earning the most points over the go-rounds with the average added in will be declared the champion. The finalists will not carry their earnings from the regular season into finals making it a sudden death for the championship. Six contestants will be taken to the finals in each of the following events: Junior Steer Riding, Junior Bull Riding, Junior Barrel Racing, Pee Wee Barrels and Novice Horse Riding. All finals contestants must attend the General Meeting or be fined $100."
  },
];

const NHSRA_SECTIONS = [
  {
    title: "General Rules for Contestants",
    content: "All contestants must be enrolled in and regularly attending grades 6-12 or be a home school student in grades 6-12. No contestant shall compete at a rodeo unless eligible under these rules. Contestants must maintain passing grades to compete. All contestants are required to read the rules carefully. Failure to understand rules will not be accepted as an excuse. Contestants must wear proper western attire including long-sleeved shirt, cowboy hat, and boots while competing. All contestants must be amateur competitors. No contestant shall accept wages for participating in a rodeo or rodeo-related activity. Contestants must conduct themselves in a manner reflecting positively on the sport of rodeo."
  },
  {
    title: "General Rules for Junior High Contestants",
    content: "Junior High contestants must be in grades 6-8. Junior High contestants compete under the same general rules as high school contestants with specific junior high divisions. Age eligibility is determined as of January 1st of the current rodeo year. Junior High contestants may compete in both Junior High and High School divisions at the same rodeo if rules permit."
  },
  {
    title: "Contestant Qualifications",
    content: "To be eligible to compete, a contestant must: Be enrolled in grades 6-12 or be a home school student. Maintain passing grades. Be a member in good standing of their state/province high school rodeo association. Have a current NHSRA membership. Not have graduated from high school more than one year prior. Contestants must not have competed at any professional rodeo for money. A contestant becomes ineligible if they accept wages for rodeo-related activities. All contestants must submit proof of enrollment and grades as required by their state association."
  },
  {
    title: "Contestant Disqualifications",
    content: "A contestant shall be disqualified for: Use of alcohol or drugs on rodeo grounds. Unsportsmanlike conduct. Mistreatment of livestock. Competing while ineligible. Cheating or attempting to cheat. Improper attire in the arena. Failure to compete when called. A contestant may be disqualified from a specific event for violation of event rules. Disqualifications must be reported to the association office. Appeals may be made to the rules committee."
  },
  {
    title: "Point Systems",
    content: "Points are awarded based on prize money won at approved rodeos. State/Province points are used to qualify for state finals. National Finals points are determined by state championship results. The All-Around award is based on points accumulated in two or more events. Points are tracked separately for each event. Year-end awards are based on total season points. National Finals qualifiers are determined by state standings."
  },
  {
    title: "Barrel Racing Rules",
    content: "Barrel racing is a timed event. The cloverleaf pattern must be followed. Regulation distances: 90 feet between barrels 1 and 2; 105 feet between barrels 1 and 3 and barrels 2 and 3; 60 feet score line. Five-second penalty per knocked barrel. Either barrel 1 or 2 may be taken first. Disqualification for not completing the cloverleaf pattern. Electronic timer required with two manual backup timers. Horse timed on the nose. After official racing time begins, reruns are not allowed. Contestant must be in proper western attire. Barrels must be 45-gallon size."
  },
  {
    title: "Pole Bending Rules",
    content: "Pole bending is a timed event. Six poles set in a straight line, 21 feet apart, first pole 21 feet from the score line. Five-second penalty per knocked pole. Five-second penalty for skipping a pole. The pattern must be completed as prescribed. Electronic timer required with manual backup. Horse timed on the nose. No reruns after official time begins. Contestant must complete the pattern in order - run the length of poles, turn, weave down, weave back up, run home."
  },
  {
    title: "Breakaway Roping Rules",
    content: "Breakaway roping is a timed event for female contestants. The rope must break away cleanly from the saddle horn. A white string or flag must be tied to the end of the rope and to the saddle horn. Time is taken when the rope breaks free. Ten-second time limit applies. Barrier penalty of 10 seconds for breaking early. Legal catches: around the neck. The rope must completely encircle the calf's neck. No crossfire catches. Proper western attire required."
  },
  {
    title: "Goat Tying Rules",
    content: "Goat tying is a timed event for female contestants and junior high contestants. Contestant starts mounted, rides to goat, dismounts, catches, throws and ties goat. Three legs must be crossed and tied. Tie must hold for six seconds after contestant removes hands and backs away. No assistance from horse in throwing or holding the goat. Time starts when contestant crosses the score line. Contestant must have horse under control and tied or hobbled."
  },
  {
    title: "Tie Down Roping Rules",
    content: "Tie down roping is a timed event. Contestant must rope calf, dismount, go to calf, and tie three legs. Tie must hold six seconds after signal is given. Calf must be thrown by hand - if calf is down when roper reaches it, calf must be let up and thrown by hand. Barrier: 10-second penalty for breaking early. Thirty-second time limit. Three-wrap tie with a half-hitch. Neck rope required on horse. Rope must remain on calf until tie is passed on. No jerking of calf after tie."
  },
  {
    title: "Team Roping Rules",
    content: "Team roping involves a header and a heeler. Legal head catches: both horns, half-head, or around the neck. Legal heel catches: both hind legs (one leg = 5-second penalty). Each team allowed two loops each. Both ropers must dally. Time taken when steer is roped front and back, ropes tight with horses facing steer. Thirty-second time limit from when steer enters arena. Barrier penalty: 10 seconds. Hondo passing over one horn with loop over other is illegal. Header must change direction of steer before heeler throws."
  },
  {
    title: "Steer Wrestling Rules",
    content: "Steer wrestling is a timed event. Contestant must jump from horse onto steer, bring steer to a stop, and throw it. Steer considered down when all four feet are in the air or when steer is on its side with all legs pointing the same direction. One hazer allowed - no assistance. One jump from horse permitted. Contestant has 30 seconds. Barrier penalty: 10 seconds. If steer is accidentally knocked down, it must be let up and thrown. Steer wrestling cattle must have blunted horns."
  },
  {
    title: "Saddle Bronc Riding Rules",
    content: "Saddle bronc riding is a timed rough stock event. Time: 8 seconds. Qualified ride requires: spurs touching horse's neck at first jump, one arm free at all times, riding with association saddle, not losing stirrups, not touching animal or equipment with free hand. Disqualifications: bucked off, changing hands on rein, wrapping rein around hand, pulling leather, losing stirrup, touching with free hand. Re-ride given if horse fails to perform or fouls the rider."
  },
  {
    title: "Bareback Riding Rules",
    content: "Bareback riding is a timed rough stock event. Time: 8 seconds. Qualified ride: spurs must be over the break of the shoulders touching horse on first jump, one hand on rigging only, not touching with free hand. Rigging: one-hand rigging, maximum 10 inches wide at handhold, maximum 6-inch D-ring. Pad required under rigging. No tape or adhesive except dry rosin. Disqualifications: bucked off, touching animal with free hand, rigging falls off. Re-rides awarded for poor horse performance."
  },
  {
    title: "Bull Riding Rules",
    content: "Bull riding is a timed rough stock event. Time: 8 seconds. One hand on bull rope, bell required under bull's belly. Qualified ride: stay on 8 seconds, rope must fall free when rider dismounts. No knots or hitches to prevent rope from falling free. Spurs may be used but not sharp. Disqualifications: bucked off, touching animal with free hand. Protective vest and helmet strongly recommended. Re-ride if bull falls or fails to perform. Bullfighters required for contestant safety."
  },
  {
    title: "Ribbon Roping Rules",
    content: "Ribbon roping is a team event with a boy roper and a girl runner. The boy ropes the calf; the girl removes a ribbon from the calf's tail and runs across the finish line. Time starts when calf leaves chute. Time ends when girl crosses finish line with ribbon. Barrier penalty applies to the roper. The ribbon must be clearly removed and the girl must cross the finish line. Both team members must be of high school or junior high age."
  },
  {
    title: "Chute Dogging Rules",
    content: "Chute dogging is a junior high event similar to steer wrestling but without a horse. Contestant starts in the chute with the steer and must throw the steer from the chute. Steer must be brought to a complete stop and thrown. Same down rules as steer wrestling apply. Time limit: 30 seconds. Protective equipment recommended."
  },
  {
    title: "Rodeo Officials",
    content: "Arena Directors are responsible for the overall conduct of the rodeo. Rodeo Secretary handles all entries, payouts, and official records. Timers must use approved electronic timing equipment backed up by manual timers. Judges must be approved and experienced. Two judges required for riding events. Field flagman required for timed events. Judges decisions are final. No contestant may talk to a judge about their performance until after the event is complete for that section."
  },
  {
    title: "Rodeo Livestock Requirements",
    content: "All livestock must be suitable for the event. Animals that are injured, sick, lame, or with defective eyesight shall not be used. Stock contractors must provide adequate numbers of animals. Bucking stock must be numbered. Timed event cattle must be uniform in size where possible. Livestock must be inspected before the draw. Animals becoming sick or injured after the draw must be replaced. Humane treatment of all livestock is required at all times."
  },
  {
    title: "Animal Welfare",
    content: "All animals must be treated humanely at all times. No sharp objects in cinches, saddles, girth, or flank straps. No stimulants or hypnotics may be administered to animals. Electric prods may be used minimally and only in the chute area. Excessive use of bat or spurs results in disqualification. A conveyance must be available to remove injured animals. Veterinarian must be on call during all performances. Mistreatment of livestock is grounds for disqualification and possible suspension."
  },
];

const WRA_SECTIONS = [
  {
    title: "About the Wildrose Rodeo Association (WRA)",
    content: "The Wildrose Rodeo Association (WRA) is an amateur rodeo association based in Alberta, Canada. The WRA sanctions amateur rodeos throughout Alberta and provides a structured competitive environment for amateur rodeo competitors. The WRA is not affiliated with the CPRA or PRCA professional circuits. High School Rodeo members who compete in roughstock events may apply for a discounted membership. Western attire is MANDATORY one hour prior to the start of any rodeo performance or slack in which you are competing - $100 fine as per rulebook."
  },
  {
    title: "WRA General Rules",
    content: "All contestants are required to read the rules carefully. Failure to understand the rules will not be accepted as an excuse. Contestants must conduct themselves in a sportsmanlike manner at all times. Western attire is mandatory on the rodeo grounds. No contestant may compete while under the influence of alcohol or drugs. All contestants must have a current WRA membership card. Contestants must comply with all bylaws, rules, and regulations of the association. Misconduct may result in fines, suspension, or expulsion from the association."
  },
  {
    title: "WRA Official Rulebook",
    content: "For the complete and most current WRA rulebook, please visit the official Wildrose Rodeo Association website at wrarodeo.com/rulebook. The rulebook is updated regularly and the official version supersedes any summary provided here. Trades can be done up until Noon on Mondays following callback - email the office for trade requests."
  },
];

type Association = "LRA" | "NHSRA" | "WRA";

interface Section {
  title: string;
  content: string;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const regex = new RegExp("(" + query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: "oklch(0.72 0.16 75 / 40%)", color: "inherit", borderRadius: "2px" }}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SectionCard({ section, query }: { section: Section; query: string }) {
  const [open, setOpen] = useState(false);

  const matches = query.trim()
    ? section.title.toLowerCase().includes(query.toLowerCase()) ||
      section.content.toLowerCase().includes(query.toLowerCase())
    : true;

  if (!matches) return null;

  return (
    <div
      style={{
        background: "oklch(0.18 0.04 48)",
        border: "1px solid oklch(0.72 0.16 75 / 20%)",
        borderRadius: "12px",
        marginBottom: "8px",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-4 py-3 flex items-center justify-between"
        style={{ color: "oklch(0.88 0.06 75)" }}
      >
        <span className="font-semibold text-sm pr-4">
          {query.trim() ? highlightText(section.title, query) : section.title}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div
          className="px-4 pb-4 text-sm leading-relaxed"
          style={{ color: "oklch(0.70 0.04 60)", borderTop: "1px solid oklch(0.72 0.16 75 / 10%)", paddingTop: "12px" }}
        >
          {query.trim() ? highlightText(section.content, query) : section.content}
        </div>
      )}
    </div>
  );
}

export default function Rulebooks() {
  const [activeAssoc, setActiveAssoc] = useState<Association>("LRA");
  const [query, setQuery] = useState("");

  const sections: Section[] = useMemo(() => {
    switch (activeAssoc) {
      case "LRA": return LRA_SECTIONS;
      case "NHSRA": return NHSRA_SECTIONS;
      case "WRA": return WRA_SECTIONS;
    }
  }, [activeAssoc]);

  const matchCount = useMemo(() => {
    if (!query.trim()) return null;
    return sections.filter(s =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.content.toLowerCase().includes(query.toLowerCase())
    ).length;
  }, [sections, query]);

  const assocInfo: Record<Association, { name: string; type: string }> = {
    LRA: { name: "Lakeland Rodeo Association", type: "Amateur" },
    NHSRA: { name: "Natl. High School Rodeo Assoc.", type: "High School / Junior" },
    WRA: { name: "Wildrose Rodeo Association", type: "Amateur" },
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "oklch(0.12 0.04 45)" }}>
      <div
        className="px-4 pt-12 pb-4"
        style={{ background: "linear-gradient(180deg, oklch(0.16 0.05 48), oklch(0.12 0.04 45))" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={24} style={{ color: "oklch(0.72 0.16 75)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.92 0.04 75)", fontFamily: "'Cinzel', serif" }}>
            Rulebooks
          </h1>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {(["LRA", "NHSRA", "WRA"] as Association[]).map(assoc => (
            <button
              key={assoc}
              onClick={() => { setActiveAssoc(assoc); setQuery(""); }}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background: activeAssoc === assoc ? "oklch(0.72 0.16 75)" : "oklch(0.20 0.05 48)",
                color: activeAssoc === assoc ? "oklch(0.15 0.04 48)" : "oklch(0.55 0.06 60)",
                border: activeAssoc === assoc ? "none" : "1px solid oklch(0.72 0.16 75 / 20%)",
              }}
            >
              {assoc}
            </button>
          ))}
        </div>

        <div
          className="rounded-xl px-4 py-3 mb-4"
          style={{ background: "oklch(0.18 0.04 48)", border: "1px solid oklch(0.72 0.16 75 / 15%)" }}
        >
          <p className="text-xs font-semibold mb-0.5" style={{ color: "oklch(0.72 0.16 75)" }}>
            {assocInfo[activeAssoc].type}
          </p>
          <p className="text-sm" style={{ color: "oklch(0.75 0.04 60)" }}>
            {assocInfo[activeAssoc].name}
          </p>
          {activeAssoc === "WRA" && (
            <p className="text-xs mt-2" style={{ color: "oklch(0.72 0.16 75)" }}>
              Visit wrarodeo.com/rulebook for the full official rulebook
            </p>
          )}
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "oklch(0.50 0.04 60)" }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search rules, penalties, events..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: "oklch(0.20 0.05 48)",
              border: "1px solid oklch(0.72 0.16 75 / 25%)",
              color: "oklch(0.88 0.04 75)",
            }}
          />
        </div>

        {query.trim() && (
          <p className="text-xs mt-2" style={{ color: "oklch(0.55 0.04 60)" }}>
            {matchCount === 0 ? "No sections found" : matchCount + " section" + (matchCount === 1 ? "" : "s") + " match"}
          </p>
        )}
      </div>

      <div className="px-4 pt-2">
        {matchCount === 0 && query.trim() ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-semibold" style={{ color: "oklch(0.72 0.16 75)" }}>No results found</p>
            <p className="text-sm mt-1" style={{ color: "oklch(0.50 0.04 60)" }}>Try a different search term</p>
          </div>
        ) : (
          sections.map((section, i) => (
            <SectionCard key={i} section={section} query={query} />
          ))
        )}
      </div>
    </div>
  );
}
