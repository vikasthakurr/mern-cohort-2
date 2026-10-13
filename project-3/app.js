const keywordCategories = {
  technical: {
    label: "Technical Skills",
    keywords: [
      "javascript",
      "python",
      "java",
      "react",
      "angular",
      "vue",
      "node.js",
      "nodejs",
      "express",
      "mongodb",
      "postgresql",
      "mysql",
      "sql",
      "nosql",
      "html",
      "css",
      "typescript",
      "graphql",
      "rest api",
      "rest apis",
      "git",
      "github",
      "docker",
      "kubernetes",
      "aws",
      "azure",
      "gcp",
      "firebase",
      "redis",
      "webpack",
      "next.js",
      "nextjs",
      "tailwind",
      "bootstrap",
      "sass",
      "less",
      "jquery",
      "c++",
      "c#",
      "ruby",
      "php",
      "swift",
      "kotlin",
      "flutter",
      "react native",
      "django",
      "flask",
      "spring boot",
      "laravel",
      "ci/cd",
      "jenkins",
      "terraform",
      "linux",
      "agile",
      "scrum",
      "jira",
      "figma",
      "photoshop",
    ],
  },
  soft: {
    label: "Soft Skills",
    keywords: [
      "leadership",
      "communication",
      "teamwork",
      "problem-solving",
      "problem solving",
      "collaboration",
      "adaptability",
      "time management",
      "critical thinking",
      "creativity",
      "project management",
      "decision making",
      "presentation",
      "negotiation",
      "conflict resolution",
      "attention to detail",
    ],
  },
  action: {
    label: "Action Verbs",
    keywords: [
      "developed",
      "built",
      "designed",
      "implemented",
      "managed",
      "led",
      "created",
      "optimized",
      "improved",
      "increased",
      "reduced",
      "delivered",
      "architected",
      "deployed",
      "automated",
      "analyzed",
      "integrated",
      "launched",
      "maintained",
      "collaborated",
      "mentored",
      "spearheaded",
      "streamlined",
      "engineered",
      "established",
      "coordinated",
      "resolved",
      "contributed",
      "refactored",
    ],
  },
  metrics: {
    label: "Quantifiable Metrics",
    keywords: [
      "percent",
      "increased by",
      "reduced by",
      "improved by",
      "revenue",
      "users",
      "traffic",
      "performance",
      "efficiency",
      "cost",
      "budget",
      "team of",
      "clients",
      "projects",
      "applications",
    ],
  },
};

const resumeSections = [
  {
    name: "Contact Information",
    patterns: ["email", "phone", "@", "linkedin"],
  },
  {
    name: "Skills",
    patterns: ["skills", "technical skills", "technologies", "proficient"],
  },
  {
    name: "Experience",
    patterns: ["experience", "work history", "employment", "worked at"],
  },
  {
    name: "Education",
    patterns: [
      "education",
      "degree",
      "university",
      "college",
      "b.tech",
      "b.sc",
      "m.tech",
      "mba",
    ],
  },
  {
    name: "Projects",
    patterns: ["projects", "project", "built", "developed", "created"],
  },
  {
    name: "Certifications",
    patterns: ["certification", "certified", "certificate", "course"],
  },
];

const scoreMessages = [
  {
    min: 0,
    max: 30,
    message:
      "Needs significant improvement. Your resume doesn't match the job well.",
    color: "#ff6b6b",
  },
  {
    min: 31,
    max: 50,
    message:
      "Below average. Consider adding more relevant keywords and details.",
    color: "#ff9f43",
  },
  {
    min: 51,
    max: 70,
    message: "Decent match. A few improvements could boost your chances.",
    color: "#f0a500",
  },
  {
    min: 71,
    max: 85,
    message: "Good match! Your resume aligns well with the job description.",
    color: "#00d4aa",
  },
  {
    min: 86,
    max: 100,
    message: "Excellent match! Your resume is highly optimized for this role.",
    color: "#00ff88",
  },
];

const STORAGE_KEY = "resumeiq.inputs";

let lastMissing = [];

// Lowercases text and strips punctuation (keeping word chars and a few tech symbols) so matching is consistent.
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s/.#+@-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Escapes regex special characters in a string so it can be used safely inside a RegExp.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
// Splits a list of job keywords into those present in the resume (matched) and those absent (missing).
function matchKeywords(resumeText, jobKeywords) {
  const normalizedResume = normalizeText(resumeText);
  const matched = [];
  const missing = [];
  jobKeywords.forEach(function (keyword) {
    if (containsTerm(normalizedResume, keyword)) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  });
  return { matched: matched, missing: missing };
}

// Checks the resume for each standard section (Contact, Skills, Experience, etc.) and flags which were found.
function analyzeSections(resumeText) {
  const normalizedResume = normalizeText(resumeText);
  return resumeSections.map(function (section) {
    const found = section.patterns.some(function (pattern) {
      return containsTerm(normalizedResume, pattern);
    });
    return { name: section.name, found: found };
  });
}

// For each keyword category, computes what percentage of job-relevant keywords the resume actually contains.
function calculateCategoryScores(resumeText, jobText) {
  const normalizedResume = normalizeText(resumeText);
  const normalizedJob = normalizeText(jobText);
  return Object.keys(keywordCategories).map(function (category) {
    const catData = keywordCategories[category];
    let jobRelevant = 0;
    let resumeMatched = 0;
    catData.keywords.forEach(function (keyword) {
      if (containsTerm(normalizedJob, keyword)) {
        jobRelevant++;
        if (containsTerm(normalizedResume, keyword)) {
          resumeMatched++;
        }
      }
    });
    const score =
      jobRelevant > 0 ? Math.round((resumeMatched / jobRelevant) * 100) : 0;
    return {
      label: catData.label,
      score: score,
      matched: resumeMatched,
      total: jobRelevant,
    };
  });
}
// Returns true if a term appears in the text, using word-boundary matching for alphanumeric terms to avoid partial hits.
function containsTerm(normalizedText, term) {
  const t = term.toLowerCase();
  if (/[a-z0-9]$/.test(t) && /^[a-z0-9]/.test(t)) {
    const pattern = new RegExp(
      "(^|[^a-z0-9])" + escapeRegex(t) + "([^a-z0-9]|$)",
      "i",
    );
    return pattern.test(normalizedText);
  }
  return normalizedText.includes(t);
}

// Scans the job description against all known category keywords and returns the unique list it mentions.
function extractJobKeywords(jobText) {
  const normalized = normalizeText(jobText);
  const found = [];
  Object.keys(keywordCategories).forEach(function (category) {
    keywordCategories[category].keywords.forEach(function (keyword) {
      if (!found.includes(keyword) && containsTerm(normalized, keyword)) {
        found.push(keyword);
      }
    });
  });
  return found;
}

// Builds a list of human-readable improvement tips based on missing sections, missing keywords, and the score.
function generateSuggestions(missing, sectionResults, score) {
  const suggestions = [];
  sectionResults.forEach(function (section) {
    if (!section.found) {
      suggestions.push(`Add a section on ${section.name}`);
    }
  });
  if (missing.length > 5) {
    suggestions.push(
      "Consider adding more relevant keywords — " +
        missing.length +
        " keywords from the job description are missing.",
    );
  }
  const missingActions = missing.filter(function (kw) {
    return keywordCategories.action.keywords.includes(kw);
  });

  if (missingActions.length > 0) {
    suggestions.push(
      "Use more action verbs like " + missingActions.slice(0, 2).join(", "),
    );
  }

  const missingMatrics = missing.filter(function (kw) {
    return keywordCategories.metrics.keywords.includes(kw);
  });

  if (missingMatrics.length > 0) {
    suggestions.push(
      "Include quantifiable metrics like " +
        missingMatrics.slice(0, 2).join(", "),
    );
  }
  if (score < 50) {
    suggestions.push(
      "Your resume score is low. Focus on matching the job description more closely.",
    );
  } else if (score < 75) {
    suggestions.push(
      "Your resume score is moderate. Try to include more specific keywords from the job posting.",
    );
  } else {
    suggestions.push(
      "Great job! Your resume matches the job description well. Keep up the good work.",
    );
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "Your resume looks great! It matches the job description very well.",
    );
  }
  return suggestions;
}
// Counts the number of words in a block of text (zero for empty/whitespace-only input).
function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

// Combines keyword match (60%), sections present (25%), and resume length (15%) into a 0-100 ATS score.
function calculateATSScore(matchedCount, total, sectionResults, wordCount) {
  const keywordScore = total > 0 ? (matchedCount / total) * 60 : 0;

  const sectionsFound = sectionResults.filter(function (s) {
    return s.found;
  }).length;
  const sectionScore = (sectionsFound / sectionResults.length) * 25;

  let lengthScore = 0;
  if (wordCount > 200) lengthScore = 15;
  else if (wordCount > 100) lengthScore = 10;
  else if (wordCount > 50) lengthScore = 5;

  return Math.min(100, Math.round(keywordScore + sectionScore + lengthScore));
}

// Returns the message + color object matching the given score band (e.g. 71-85 = "Good match!").
function getScoreMessage(score) {
  return (
    scoreMessages.find(function (item) {
      return score >= item.min && score <= item.max;
    }) || scoreMessages[0]
  );
}

// Renders the resume-section checklist into the DOM, marking each section as Found or Missing.
function renderSections(sectionResults) {
  const container = document.getElementById("sections-container");
  container.innerHTML = "";

  sectionResults.forEach(function (section) {
    const div = document.createElement("div");
    div.className = "section-item";
    div.innerHTML = `
      <span class="section-icon">${section.found ? "✓" : "✗"}</span>
      <span class="section-name">${section.name}</span>
      <span class="section-status">${section.found ? "Found" : "Missing"}</span>
    `;
    container.appendChild(div);
  });
}

// Renders the list of improvement suggestions into the DOM.
function renderSuggestions(suggestion) {
  const container = document.getElementById("suggestions-container");
  container.innerHTML = "";

  suggestion.forEach(function (suggest) {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerHTML = `
      <span class="suggestion-icon">•</span>
      <span class="suggestion-text">${suggest}</span>
    `;
    container.appendChild(div);
  });
}

// Copies the last analysis's missing keywords to the clipboard and reports the result in the status line.
function copyMissingKeywords() {
  const missing = lastMissing;
  const status = document.getElementById("copystatus");
  if (missing.length === 0) {
    status.textContent = "nothing to copy";
    return;
  }
  navigator.clipboard.writeText(missing.join(",")).then(
    function () {
      status.textContent = "copied" + missing.length + "keywords";
    },
    function () {
      status.textContent = "failed to copy";
    },
  );
}

// Updates the score number, message, word count, and the circular progress ring in the UI.
function renderScore(score, wordCount) {
  const scoreValue = document.getElementById("scoreValue");
  const scoreMessage = document.getElementById("scoreMessage");
  const scoreCircle = document.getElementById("scoreCircle");
  const wordCountEl = document.getElementById("wordCount");

  const info = getScoreMessage(score);
  scoreValue.textContent = score;
  scoreValue.style.color = info.color;
  scoreMessage.textContent = info.message;
  if (wordCountEl) {
    wordCountEl.textContent = wordCount + " words in resume";
  }
  if (scoreCircle) {
    scoreCircle.style.background =
      "conic-gradient(" +
      info.color +
      " " +
      score * 3.6 +
      "deg, var(--track) 0deg)";
  }
}

// Renders a labeled progress bar for each keyword category score into the DOM.
function renderCategories(categoryScores) {
  const container = document.getElementById("categories-container");
  if (!container) return;
  container.innerHTML = "";

  categoryScores.forEach(function (cat) {
    const div = document.createElement("div");
    div.className = "category-item";
    div.innerHTML = `
      <div class="category-head">
        <span class="category-name">${cat.label}</span>
        <span class="category-score">${cat.score}% (${cat.matched}/${cat.total})</span>
      </div>
      <div class="category-bar">
        <div class="category-fill" style="width:${cat.score}%"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

// Renders the matched keywords as chips, or an empty-state note when there are none.
function renderMatched(matched) {
  const container = document.getElementById("matched-container");
  if (!container) return;
  container.innerHTML = "";
  if (matched.length === 0) {
    container.innerHTML =
      '<p class="empty-note">No matching keywords found.</p>';
    return;
  }
  matched.forEach(function (kw) {
    const span = document.createElement("span");
    span.className = "chip chip-matched";
    span.textContent = kw;
    container.appendChild(span);
  });
}

// Renders the missing keywords as chips, or an empty-state note when nothing is missing.
function renderMissing(missing) {
  const container = document.getElementById("missing-container");
  if (!container) return;
  container.innerHTML = "";
  if (missing.length === 0) {
    container.innerHTML =
      '<p class="empty-note">Nothing missing. Nicely done!</p>';
    return;
  }
  missing.forEach(function (kw) {
    const span = document.createElement("span");
    span.className = "chip chip-missing";
    span.textContent = kw;
    container.appendChild(span);
  });
}

// Main entry point: reads the inputs, runs the full analysis, renders every result, saves state, and fires the "analyzed" event.
function analyzeResume() {
  const resumeText = document.getElementById("resumeInput").value;
  const jobText = document.getElementById("jobInput").value;
  const status = document.getElementById("analyzeStatus");

  if (!resumeText.trim() || !jobText.trim()) {
    if (status) {
      status.textContent =
        "Please paste both your resume and the job description.";
      status.classList.add("error");
    }
    return;
  }
  if (status) {
    status.textContent = "";
    status.classList.remove("error");
  }

  const jobKeywords = extractJobKeywords(jobText);
  const matchResult = matchKeywords(resumeText, jobKeywords);
  const sectionResults = analyzeSections(resumeText);
  const categoryScores = calculateCategoryScores(resumeText, jobText);
  const wordCount = countWords(resumeText);
  const score = calculateATSScore(
    matchResult.matched.length,
    jobKeywords.length,
    sectionResults,
    wordCount,
  );
  const suggestions = generateSuggestions(
    matchResult.missing,
    sectionResults,
    score,
  );

  lastMissing = matchResult.missing;

  renderScore(score, wordCount);
  renderCategories(categoryScores);
  renderSections(sectionResults);
  renderMatched(matchResult.matched);
  renderMissing(matchResult.missing);
  renderSuggestions(suggestions);

  const results = document.getElementById("results");
  if (results) results.classList.remove("hidden");

  window.ResumeIQ = {
    score: score,
    matched: matchResult.matched,
    missing: matchResult.missing,
    resumeText: resumeText,
    jobText: jobText,
  };

  saveInputs();
  document.dispatchEvent(new CustomEvent("resumeiq:analyzed"));
}

// Persists the current resume and job-description text to localStorage.
function saveInputs() {
  try {
    const payload = {
      resume: document.getElementById("resumeInput").value,
      job: document.getElementById("jobInput").value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Could not save inputs", e);
  }
}

// Restores previously saved inputs and the saved theme from localStorage on page load.
function loadInputs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const payload = JSON.parse(raw);
      if (payload.resume) {
        document.getElementById("resumeInput").value = payload.resume;
      }
      if (payload.job) {
        document.getElementById("jobInput").value = payload.job;
      }
    }
  } catch (e) {
    console.warn("Could not load saved inputs", e);
  }

  try {
    const savedTheme = localStorage.getItem("resumeiq.theme");
    if (savedTheme) {
      document.documentElement.setAttribute("theme", savedTheme);
    }
  } catch (e) {
    /* ignore */
  }
}

// Wires up the theme toggle button to switch between light/dark and remember the choice.
function initThemeToggle() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;
  toggle.addEventListener("click", function () {
    const root = document.documentElement;
    const next = root.getAttribute("theme") === "light" ? "dark" : "light";
    root.setAttribute("theme", next);

    try {
      localStorage.setItem("resumeiq.theme", next);
    } catch (e) {
      console.warn("Could not save theme preference", e);
    }
  });
}

document.getElementById("analyzeBtn").addEventListener("click", analyzeResume);
document
  .getElementById("copyMissingKeywords")
  .addEventListener("click", copyMissingKeywords);
initThemeToggle();
loadInputs();
