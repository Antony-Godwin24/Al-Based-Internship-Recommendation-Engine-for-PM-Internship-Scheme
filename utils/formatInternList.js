function formatInternList(internships) {
  if (!Array.isArray(internships) || internships.length === 0) {
    return "❌ No internships found.";
  }

  return internships
    .map((intern, index) => {
      return `${index + 1}. ${intern.company} - ${intern.title}\nLocation: ${intern.location}\nSkills: ${intern.skills_required}\n`;
    })
    .join("\n");
}

module.exports = formatInternList;
