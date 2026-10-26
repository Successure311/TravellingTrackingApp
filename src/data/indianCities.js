// "City|State" - bundled so suggestions work offline with no API key.
const RAW = `Mumbai|Maharashtra;Delhi|Delhi;New Delhi|Delhi;Bengaluru|Karnataka;Bangalore|Karnataka;Hyderabad|Telangana;Secunderabad|Telangana;Chennai|Tamil Nadu;Kolkata|West Bengal;Pune|Maharashtra;Ahmedabad|Gujarat;Surat|Gujarat;Jaipur|Rajasthan;Lucknow|Uttar Pradesh;Kanpur|Uttar Pradesh;Nagpur|Maharashtra;Indore|Madhya Pradesh;Bhopal|Madhya Pradesh;Visakhapatnam|Andhra Pradesh;Vizag|Andhra Pradesh;Patna|Bihar;Vadodara|Gujarat;Ghaziabad|Uttar Pradesh;Ludhiana|Punjab;Agra|Uttar Pradesh;Nashik|Maharashtra;Faridabad|Haryana;Meerut|Uttar Pradesh;Rajkot|Gujarat;Varanasi|Uttar Pradesh;Srinagar|Jammu & Kashmir;Aurangabad|Maharashtra;Dhanbad|Jharkhand;Amritsar|Punjab;Navi Mumbai|Maharashtra;Thane|Maharashtra;Allahabad|Uttar Pradesh;Prayagraj|Uttar Pradesh;Ranchi|Jharkhand;Howrah|West Bengal;Coimbatore|Tamil Nadu;Jabalpur|Madhya Pradesh;Gwalior|Madhya Pradesh;Vijayawada|Andhra Pradesh;Jodhpur|Rajasthan;Madurai|Tamil Nadu;Raipur|Chhattisgarh;Kota|Rajasthan;Guwahati|Assam;Chandigarh|Chandigarh;Solapur|Maharashtra;Hubli|Karnataka;Hubballi|Karnataka;Dharwad|Karnataka;Mysuru|Karnataka;Mysore|Karnataka;Tiruchirappalli|Tamil Nadu;Trichy|Tamil Nadu;Bareilly|Uttar Pradesh;Moradabad|Uttar Pradesh;Gurugram|Haryana;Gurgaon|Haryana;Noida|Uttar Pradesh;Greater Noida|Uttar Pradesh;Aligarh|Uttar Pradesh;Jalandhar|Punjab;Bhubaneswar|Odisha;Cuttack|Odisha;Salem|Tamil Nadu;Warangal|Telangana;Guntur|Andhra Pradesh;Bhiwandi|Maharashtra;Saharanpur|Uttar Pradesh;Gorakhpur|Uttar Pradesh;Bikaner|Rajasthan;Amravati|Maharashtra;Jamshedpur|Jharkhand;Bhilai|Chhattisgarh;Cochin|Kerala;Kochi|Kerala;Ernakulam|Kerala;Thiruvananthapuram|Kerala;Trivandrum|Kerala;Kozhikode|Kerala;Calicut|Kerala;Thrissur|Kerala;Kannur|Kerala;Kollam|Kerala;Palakkad|Kerala;Alappuzha|Kerala;Munnar|Kerala;Kottayam|Kerala;Dehradun|Uttarakhand;Haridwar|Uttarakhand;Rishikesh|Uttarakhand;Nainital|Uttarakhand;Mussoorie|Uttarakhand;Haldwani|Uttarakhand;Shimla|Himachal Pradesh;Manali|Himachal Pradesh;Dharamshala|Himachal Pradesh;Kullu|Himachal Pradesh;Jammu|Jammu & Kashmir;Leh|Ladakh;Kargil|Ladakh;Gangtok|Sikkim;Darjeeling|West Bengal;Siliguri|West Bengal;Durgapur|West Bengal;Asansol|West Bengal;Imphal|Manipur;Shillong|Meghalaya;Aizawl|Mizoram;Kohima|Nagaland;Dimapur|Nagaland;Itanagar|Arunachal Pradesh;Agartala|Tripura;Dibrugarh|Assam;Jorhat|Assam;Silchar|Assam;Tezpur|Assam;Port Blair|Andaman & Nicobar;Panaji|Goa;Margao|Goa;Vasco da Gama|Goa;Mapusa|Goa;Goa|Goa;Dabolim|Goa;Mangaluru|Karnataka;Mangalore|Karnataka;Udupi|Karnataka;Belagavi|Karnataka;Belgaum|Karnataka;Kalaburagi|Karnataka;Ballari|Karnataka;Davangere|Karnataka;Shivamogga|Karnataka;Tumakuru|Karnataka;Hosur|Tamil Nadu;Vellore|Tamil Nadu;Erode|Tamil Nadu;Tirunelveli|Tamil Nadu;Thanjavur|Tamil Nadu;Tiruppur|Tamil Nadu;Thoothukudi|Tamil Nadu;Kanyakumari|Tamil Nadu;Rameswaram|Tamil Nadu;Ooty|Tamil Nadu;Kodaikanal|Tamil Nadu;Puducherry|Puducherry;Pondicherry|Puducherry;Tirupati|Andhra Pradesh;Nellore|Andhra Pradesh;Kurnool|Andhra Pradesh;Rajahmundry|Andhra Pradesh;Kakinada|Andhra Pradesh;Anantapur|Andhra Pradesh;Kadapa|Andhra Pradesh;Karimnagar|Telangana;Nizamabad|Telangana;Khammam|Telangana;Adilabad|Telangana;Kolhapur|Maharashtra;Sangli|Maharashtra;Satara|Maharashtra;Nanded|Maharashtra;Latur|Maharashtra;Akola|Maharashtra;Jalgaon|Maharashtra;Dhule|Maharashtra;Ahmednagar|Maharashtra;Shirdi|Maharashtra;Lonavala|Maharashtra;Mahabaleshwar|Maharashtra;Ratnagiri|Maharashtra;Panvel|Maharashtra;Kalyan|Maharashtra;Vasai|Maharashtra;Mira Road|Maharashtra;Bhavnagar|Gujarat;Jamnagar|Gujarat;Junagadh|Gujarat;Gandhinagar|Gujarat;Anand|Gujarat;Bharuch|Gujarat;Navsari|Gujarat;Vapi|Gujarat;Valsad|Gujarat;Bhuj|Gujarat;Porbandar|Gujarat;Somnath|Gujarat;Dwarka|Gujarat;Mehsana|Gujarat;Morbi|Gujarat;Ajmer|Rajasthan;Udaipur|Rajasthan;Pushkar|Rajasthan;Jaisalmer|Rajasthan;Alwar|Rajasthan;Bharatpur|Rajasthan;Bhilwara|Rajasthan;Sikar|Rajasthan;Sri Ganganagar|Rajasthan;Mount Abu|Rajasthan;Chittorgarh|Rajasthan;Ujjain|Madhya Pradesh;Sagar|Madhya Pradesh;Satna|Madhya Pradesh;Rewa|Madhya Pradesh;Ratlam|Madhya Pradesh;Khandwa|Madhya Pradesh;Chhindwara|Madhya Pradesh;Bilaspur|Chhattisgarh;Durg|Chhattisgarh;Korba|Chhattisgarh;Jagdalpur|Chhattisgarh;Mathura|Uttar Pradesh;Vrindavan|Uttar Pradesh;Ayodhya|Uttar Pradesh;Jhansi|Uttar Pradesh;Firozabad|Uttar Pradesh;Mirzapur|Uttar Pradesh;Sultanpur|Uttar Pradesh;Basti|Uttar Pradesh;Bareli|Uttar Pradesh;Rampur|Uttar Pradesh;Muzaffarnagar|Uttar Pradesh;Shahjahanpur|Uttar Pradesh;Etawah|Uttar Pradesh;Gaya|Bihar;Bhagalpur|Bihar;Muzaffarpur|Bihar;Darbhanga|Bihar;Purnia|Bihar;Arrah|Bihar;Begusarai|Bihar;Bodh Gaya|Bihar;Hazaribagh|Jharkhand;Bokaro|Jharkhand;Deoghar|Jharkhand;Rourkela|Odisha;Berhampur|Odisha;Sambalpur|Odisha;Puri|Odisha;Balasore|Odisha;Kharagpur|West Bengal;Bardhaman|West Bengal;Malda|West Bengal;Haldia|West Bengal;Kalyani|West Bengal;Patiala|Punjab;Bathinda|Punjab;Mohali|Punjab;Pathankot|Punjab;Hoshiarpur|Punjab;Panipat|Haryana;Ambala|Haryana;Karnal|Haryana;Rohtak|Haryana;Hisar|Haryana;Sonipat|Haryana;Panchkula|Haryana;Kurukshetra|Haryana;Yamunanagar|Haryana;Rewari|Haryana;Bhiwani|Haryana;Pilani|Rajasthan;Hapur|Uttar Pradesh;Bulandshahr|Uttar Pradesh;Kasauli|Himachal Pradesh;Solan|Himachal Pradesh;Mandi|Himachal Pradesh;Kangra|Himachal Pradesh;Pahalgam|Jammu & Kashmir;Gulmarg|Jammu & Kashmir;Katra|Jammu & Kashmir;Udhampur|Jammu & Kashmir;Pondy|Puducherry;Silvassa|Dadra & Nagar Haveli;Daman|Daman & Diu;Diu|Daman & Diu;Kavaratti|Lakshadweep;Hampi|Karnataka;Gokarna|Karnataka;Coorg|Karnataka;Madikeri|Karnataka;Chikmagalur|Karnataka;Bidar|Karnataka;Hassan|Karnataka;Mandya|Karnataka;Ongole|Andhra Pradesh;Eluru|Andhra Pradesh;Machilipatnam|Andhra Pradesh;Tirumala|Andhra Pradesh;Amaravati|Andhra Pradesh;Chittoor|Andhra Pradesh;Mahabalipuram|Tamil Nadu;Kanchipuram|Tamil Nadu;Chengalpattu|Tamil Nadu;Karaikudi|Tamil Nadu;Dindigul|Tamil Nadu;Namakkal|Tamil Nadu;Nagercoil|Tamil Nadu;Sivakasi|Tamil Nadu;Mettupalayam|Tamil Nadu;Wayanad|Kerala;Kasaragod|Kerala;Malappuram|Kerala;Thalassery|Kerala;Pathanamthitta|Kerala;Varkala|Kerala;Kovalam|Kerala;Idukki|Kerala;Thekkady|Kerala`;

// Alternate / old names -> the one official name we store and count.
const ALIASES = {
  bangalore: "Bengaluru", "bangalore rural": "Bengaluru", bombay: "Mumbai", calcutta: "Kolkata", madras: "Chennai",
  vizag: "Visakhapatnam", gurgaon: "Gurugram", mysore: "Mysuru", mangalore: "Mangaluru", belgaum: "Belagavi",
  allahabad: "Prayagraj", trivandrum: "Thiruvananthapuram", cochin: "Kochi", ernakulam: "Kochi", calicut: "Kozhikode",
  pondicherry: "Puducherry", pondy: "Puducherry", trichy: "Tiruchirappalli", hubli: "Hubballi",
  secunderabad: "Hyderabad", "new delhi": "Delhi", bareli: "Bareilly", baroda: "Vadodara", poona: "Pune",
  dabolim: "Goa",
};

const ALL = RAW.split(";").map((s) => {
  const [name, state] = s.split("|");
  return { name, state, key: name.toLowerCase(), skey: state.toLowerCase() };
});
const byKey = new Map(ALL.map((c) => [c.key, c]));

// Canonical entries only (aliases removed) - what suggestions show.
export const CITIES = ALL.filter((c) => !ALIASES[c.key] || ALIASES[c.key] === c.name).map((c) => ({
  ...c,
  aliases: Object.keys(ALIASES).filter((a) => ALIASES[a] === c.name),
}));
const canonByKey = new Map(CITIES.map((c) => [c.key, c]));

const titleCase = (s) => s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());

// States / UTs: typing "gujarat" suggests the state itself (and its cities below it).
const STATE_NAMES = "Andhra Pradesh;Arunachal Pradesh;Assam;Bihar;Chhattisgarh;Gujarat;Haryana;Himachal Pradesh;Jharkhand;Karnataka;Kerala;Madhya Pradesh;Maharashtra;Manipur;Meghalaya;Mizoram;Nagaland;Odisha;Punjab;Rajasthan;Sikkim;Tamil Nadu;Telangana;Tripura;Uttar Pradesh;Uttarakhand;West Bengal;Andaman & Nicobar;Dadra & Nagar Haveli;Daman & Diu;Jammu & Kashmir;Ladakh;Lakshadweep".split(";");
const STATE_ENTRIES = STATE_NAMES.map((name) => ({ name, state: "State / UT", key: name.toLowerCase(), skey: "", aliases: [], isState: true }));
const stateByKey = new Map(STATE_ENTRIES.map((c) => [c.key, c]));

// Places the user typed that are not in the list. Remembered on this phone, and also rebuilt
// from the sheet rows (registerPlaces), so they show up on every device.
const CUSTOM_KEY = "wayfarer_custom_places";
const custom = new Map(); // lower-case key -> display name
try {
  JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]").forEach((n) => custom.set(n.toLowerCase(), n));
} catch {
  /* ignore */
}
// Places we must not suggest again (what was already in the sheet when the user chose "start fresh").
const IGNORED_KEY = "wayfarer_ignored_places";
const ignored = new Set();
try {
  JSON.parse(localStorage.getItem(IGNORED_KEY) || "[]").forEach((n) => ignored.add(n));
} catch {
  /* ignore */
}
const saveIgnored = () => {
  try {
    localStorage.setItem(IGNORED_KEY, JSON.stringify([...ignored]));
  } catch {
    /* ignore */
  }
};

const isKnown = (k) => ALIASES[k] || canonByKey.has(k) || byKey.has(k) || stateByKey.has(k);

export function addCustomPlace(input, persist = true) {
  const name = canonicalCity(input);
  const k = name.toLowerCase();
  if (!name || isKnown(k) || custom.has(k)) return;
  if (!persist && ignored.has(k)) return; // sheet rows seen before the reset
  if (persist && ignored.delete(k)) saveIgnored(); // the user typed it again: welcome back
  custom.set(k, name);
  if (persist) {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify([...custom.values()]));
    } catch {
      /* ignore */
    }
  }
}
// "Start fresh": forget typed places, and stop suggesting the ones already in the sheet.
export function clearSuggestions(placeNames) {
  custom.clear();
  try {
    localStorage.removeItem(CUSTOM_KEY);
  } catch {
    /* ignore */
  }
  placeNames.forEach((n) => ignored.add(canonicalCity(n).toLowerCase()));
  saveIgnored();
}
export const registerPlaces = (names) => names.forEach((n) => addCustomPlace(n, false));

const customEntries = () => [...custom.values()].map((name) => ({ name, state: "Added by you", key: name.toLowerCase(), skey: "", aliases: [] }));

// "  bangalore " / "BENGALURU" / "Bangalore" -> "Bengaluru". Unknown cities are just tidied.
export function canonicalCity(input) {
  const t = String(input ?? "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  const k = t.toLowerCase();
  if (ALIASES[k]) return ALIASES[k];
  const hit = canonByKey.get(k) || byKey.get(k) || stateByKey.get(k);
  if (hit) return hit.name;
  return custom.get(k) || titleCase(t);
}

export function searchCities(q, limit = 8) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const scored = [];
  for (const c of [...CITIES, ...STATE_ENTRIES, ...customEntries()]) {
    const names = [c.key, ...c.aliases];
    let score = 0;
    for (const n of names) {
      let sc = 0;
      if (n === s) sc = 100;
      else if (n.startsWith(s)) sc = 80 - Math.min(n.length - s.length, 30) * 0.1;
      else if (n.split(" ").some((w) => w.startsWith(s))) sc = 60;
      else if (n.includes(s)) sc = 40;
      score = Math.max(score, sc);
    }
    if (!score && c.skey.startsWith(s)) score = 20;
    if (!score && s.length >= 3 && isSubsequence(s, c.key)) score = 10;
    if (score) scored.push([score, c]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, limit).map((x) => x[1]);
}

function isSubsequence(s, t) {
  let i = 0;
  for (const ch of t) if (ch === s[i]) i++;
  return i === s.length;
}
