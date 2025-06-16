//no api required 
function toggleMode() {
  document.body.classList.toggle("dark-mode");
  document.querySelectorAll(".dark-mode\\:text-gray-100").forEach(el => el.classList.toggle("text-gray-100"));
  document.querySelectorAll(".dark-mode\\:text-gray-300").forEach(el => el.classList.toggle("text-gray-300"));
  if (window.scoreChart) {
    window.scoreChart.options.plugins.legend.labels.color = document.body.classList.contains('dark-mode') ? '#e5e7eb' : '#374151';
    window.scoreChart.options.plugins.title.color = document.body.classList.contains('dark-mode') ? '#e5e7eb' : '#374151';
    window.scoreChart.update();
  }
}
 
function extractKeywords(text) {
  const stopwords = ['and','or','the','with','for','a','to','in','on','at','of','an','as','by','is','are'];
  return text.toLowerCase().match(/\b[a-z]{4,}\b/g)?.filter(w => !stopwords.includes(w)) || [];
}

function calculateScore() {
  const calculateBtn = document.getElementById("calculateBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  calculateBtn.disabled = true;
  calculateBtn.classList.add("loading");
  calculateBtn.textContent = "Calculating...";

  const resume = document.getElementById("resume").value.toLowerCase();
  const jd = document.getElementById("jd").value.toLowerCase();

  if (!resume || !jd) {
    alert("Please provide both resume and job description.");
    calculateBtn.disabled = false;
    calculateBtn.classList.remove("loading");
    calculateBtn.textContent = "Check ATS Score";
    return;
  }

  // Get custom weights
  const weightKeyword = parseInt(document.getElementById("weightKeyword").value) || 60;
  const weightWord = parseInt(document.getElementById("weightWord").value) || 10;
  const weightContact = parseInt(document.getElementById("weightContact").value) || 10;
  const weightSocial = parseInt(document.getElementById("weightSocial").value) || 10;
  const weightSpacing = parseInt(document.getElementById("weightSpacing").value) || 10;
  const maxTotal = weightKeyword + weightWord + weightContact + weightSocial + weightSpacing;

  // Keyword score
  const keywords = [...new Set(extractKeywords(jd))];
  const matched = keywords.filter(k => resume.includes(k));
  const missing = keywords.filter(k => !resume.includes(k));
  const keywordScore = Math.round((matched.length / keywords.length) * weightKeyword);

  // Word count score
  const wordCount = resume.split(/\s+/).length;
  const wordScore = (wordCount >= 300 && wordCount <= 900) ? weightWord : Math.round(weightWord / 2);

  // Contact info score
  const hasEmail = /[\w.-]+@[\w.-]+/.test(resume);
  const hasPhone = /\d{10}|\(\d{3}\)\s?\d{3}-\d{4}/.test(resume);
  const contactScore = (hasEmail && hasPhone) ? weightContact : Math.round(weightContact / 2);

  // Social links score
  const hasSocial = /(linkedin\.com|github\.com|portfolio|behance\.net|dribbble\.com|medium\.com)/.test(resume);
  const socialScore = hasSocial ? weightSocial : Math.round(weightSocial / 2);

  // Line spacing score
  const emptyLines = (resume.match(/\n{2,}/g) || []).length;
  const spacingScore = (emptyLines <= 5) ? weightSpacing : Math.round(weightSpacing / 2);

  // Total score
  const totalScore = Math.round(((keywordScore + wordScore + contactScore + socialScore + spacingScore) / maxTotal) * 100);

  // Formatting checks
  const bulletCount = (resume.match(/^\s*[-*]\s+/gm) || []).length;
  const headingCount = (resume.match(/^[A-Z][A-Z\s]{2,}$/gm) || []).length;
  const formattingTips = [];
  if (bulletCount < 5) formattingTips.push("Add more bullet points (e.g., '- Item') to improve readability.");
  if (headingCount < 2) formattingTips.push("Include clear section headings (e.g., 'EXPERIENCE', 'EDUCATION') in all caps.");
  if (wordCount > 900) formattingTips.push("Reduce word count to 300-900 for optimal ATS compatibility.");

  // Update UI
  document.getElementById("scoreResult").innerText = `✅ ATS Score: ${totalScore}%`;
  document.getElementById("progressBar").style.width = `${totalScore}%`;
  document.getElementById("scoreBreakdown").innerHTML = `
    <h3 class="text-lg font-semibold text-gray-800 dark-mode:text-gray-100">Score Breakdown</h3>
    <ul class="mt-2 space-y-2">
      <li class="text-gray-700 dark-mode:text-gray-300"><strong>Keyword Match:</strong> ${keywordScore}/${weightKeyword}</li>
      <li class="text-gray-700 dark-mode:text-gray-300"><strong>Word Count:</strong> ${wordScore}/${weightWord} (Found: ${wordCount})</li>
      <li class="text-gray-700 dark-mode:text-gray-300"><strong>Contact Info:</strong> ${contactScore}/${weightContact} (${hasEmail ? '📧 Email' : '❌ No email'}, ${hasPhone ? '📞 Phone' : '❌ No phone'})</li>
      <li class="text-gray-700 dark-mode:text-gray-300"><strong>Social Links:</strong> ${socialScore}/${weightSocial} (${hasSocial ? '✅ Present' : '❌ Missing'})</li>
      <li class="text-gray-700 dark-mode:text-gray-300"><strong>Line Spacing:</strong> ${spacingScore}/${weightSpacing} (${emptyLines} empty lines)</li>
    </ul>`;

  document.getElementById("keywordSection").innerHTML = `
    <h3 class="text-lg font-semibold text-gray-800 dark-mode:text-gray-100">Keyword Analysis</h3>
    <div class="mt-2">
      <p><strong>Matched Keywords:</strong> <span class="keyword-matched">${matched.length > 0 ? matched.join(', ') : 'None'}</span></p>
      <p><strong>Missing Keywords (Add these to improve score):</strong> <span class="keyword-missing">${missing.length > 0 ? missing.join(', ') : 'All keywords matched'}</span></p>
    </div>`;

  document.getElementById("formattingTips").innerHTML = `
    <h3 class="text-lg font-semibold text-gray-800 dark-mode:text-gray-100">Formatting Tips</h3>
    <ul class="mt-2 space-y-2 text-gray-700 dark-mode:text-gray-300">
      ${formattingTips.length > 0 ? formattingTips.map(tip => `<li>${tip}</li>`).join('') : '<li>Your resume formatting looks good!</li>'}
    </ul>`;

  drawChart(keywordScore, wordScore, contactScore, socialScore, spacingScore);

  downloadBtn.classList.remove("hidden");
  downloadBtn.onclick = () => downloadReport(totalScore, keywordScore, wordScore, contactScore, socialScore, spacingScore, matched, missing, wordCount, hasEmail, hasPhone, hasSocial, emptyLines, formattingTips, weightKeyword, weightWord, weightContact, weightSocial, weightSpacing);

  calculateBtn.disabled = false;
  calculateBtn.classList.remove("loading");
  calculateBtn.textContent = "Check ATS Score";
}

function drawChart(keywordScore, wordScore, contactScore, socialScore, spacingScore) {
  const ctx = document.getElementById("scoreChart").getContext("2d");
  if (window.scoreChart instanceof Chart) {
    window.scoreChart.destroy();
  }
  const total = keywordScore + wordScore + contactScore + socialScore + spacingScore;
  window.scoreChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Keyword Match', 'Word Count', 'Contact Info', 'Social Links', 'Line Spacing'],
      datasets: [{
        data: [keywordScore, wordScore, contactScore, socialScore, spacingScore],
        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#e11d48', '#8b5cf6'],
        borderWidth: 1,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: { size: 14 },
            color: document.body.classList.contains('dark-mode') ? '#e5e7eb' : '#374151'
          }
        },
        title: {
          display: true,
          text: 'ATS Score Breakdown',
          font: { size: 16, weight: 'bold' },
          color: document.body.classList.contains('dark-mode') ? '#e5e7eb' : '#374151'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  if (file.type === "application/pdf") {
    reader.onload = function() {
      const loadingTask = pdfjsLib.getDocument({ data: reader.result });
      loadingTask.promise.then(pdf => {
        let textPromises = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          textPromises.push(pdf.getPage(i).then(page => page.getTextContent().then(text => text.items.map(s => s.str).join(' '))));
        }
        Promise.all(textPromises).then(pages => {
          document.getElementById("resume").value = pages.join(' ');
        }).catch(() => alert("Error reading PDF file."));
      });
    };
    reader.readAsArrayBuffer(file);
  } else if (file.name.endsWith(".docx")) {
    reader.onload = function(event) {
      mammoth.extractRawText({ arrayBuffer: event.target.result })
        .then(result => {
          document.getElementById("resume").value = result.value;
        }).catch(() => alert("Error reading DOCX file."));
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert("Please upload a valid PDF or DOCX file.");
  }
}

function clearInputs() {
  document.getElementById("resume").value = "";
  document.getElementById("jd").value = "";
  document.getElementById("weightKeyword").value = "60";
  document.getElementById("weightWord").value = "10";
  document.getElementById("weightContact").value = "10";
  document.getElementById("weightSocial").value = "10";
  document.getElementById("weightSpacing").value = "10";
  document.getElementById("scoreResult").innerText = "";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("scoreBreakdown").innerHTML = "";
  document.getElementById("keywordSection").innerHTML = "";
  document.getElementById("formattingTips").innerHTML = "";
  document.getElementById("downloadBtn").classList.add("hidden");
  if (window.scoreChart) {
    window.scoreChart.destroy();
  }
}

function downloadReport(totalScore, keywordScore, wordScore, contactScore, socialScore, spacingScore, matched, missing, wordCount, hasEmail, hasPhone, hasSocial, emptyLines, formattingTips, weightKeyword, weightWord, weightContact, weightSocial, weightSpacing) {
  const report = `
ATS Score Report
Generated on: ${new Date().toLocaleString()}

Total ATS Score: ${totalScore}%

Score Breakdown:
- Keyword Match: ${keywordScore}/${weightKeyword}
- Word Count: ${wordScore}/${weightWord} (Found: ${wordCount} words)
- Contact Info: ${contactScore}/${weightContact} (${hasEmail ? 'Email present' : 'No email'}, ${hasPhone ? 'Phone present' : 'No phone'})
- Social Links: ${socialScore}/${weightSocial} (${hasSocial ? 'Present' : 'Missing'})
- Line Spacing: ${spacingScore}/${weightSpacing} (${emptyLines} empty lines)

Keyword Analysis:
- Matched Keywords: ${matched.length > 0 ? matched.join(', ') : 'None'}
- Missing Keywords: ${missing.length > 0 ? missing.join(', ') : 'All keywords matched'}

Formatting Tips:
${formattingTips.length > 0 ? formattingTips.map(tip => `- ${tip}`).join('\n') : '- Your resume formatting looks good!'}
  `;
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ATS_Score_Report.txt';
  a.click();
  URL.revokeObjectURL(url);
}
