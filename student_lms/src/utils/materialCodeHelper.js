// Helper to provide starter code, target language, and teacher guidance
// for any lesson topic across Grade 7 - 12

export function getCodeConfigForMaterial(material) {
  if (!material) {
    return {
      language: 'python',
      starterCode: '# Write your Python code here\nprint("Hello World!")\n',
      teacherNotes: 'Follow the module explanation and try modifying the code above.',
    };
  }

  const title = (material.topic || material.title || '').toLowerCase();
  const desc = (material.description || '').toLowerCase();
  const className = (material.class?.name || '').toLowerCase();
  const subject = (material.class?.subject || '').toLowerCase();
  const teacherName = material.class?.teacher?.name || 'Class Teacher';
  const schoolName = material.class?.teacher?.school || 'School';

  // 1. Web Development (Grade 12 or HTML/CSS/Web topics)
  if (
    className.includes('12') ||
    title.includes('html') ||
    title.includes('css') ||
    title.includes('web') ||
    title.includes('dom') ||
    subject.includes('web')
  ) {
    return {
      language: 'html',
      starterCode: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 24px;
      margin: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #1e293b;
      padding: 24px;
      border-radius: 16px;
      border: 1px solid #334155;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }
    h1 { color: #38bdf8; margin-top: 0; }
    p { line-height: 1.6; color: #94a3b8; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #3b82f6;
      color: white;
      border-radius: 999px;
      font-size: 12px;
      font-weight: bold;
    }
    button {
      margin-top: 16px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.1s ease;
    }
    button:hover { transform: scale(1.03); }
  </style>
</head>
<body>
  <div class="container">
    <span class="badge">Web Module Practice</span>
    <h1>${material.topic || material.title || 'Interactive Web Page'}</h1>
    <p>Welcome to the hands-on web development session. Modify the HTML, CSS, and interactive JavaScript here.</p>
    <button onclick="greet()">Test JavaScript Interaction</button>
  </div>

  <script>
    function greet() {
      alert("Great job! Your JavaScript snippet executed successfully.");
    }
  </script>
</body>
</html>`,
      teacherNotes: `Teacher Guidance Notes (${teacherName}):
1. Review standard HTML structure (<head>, <body>, <div>, etc.).
2. Experiment by customizing background colors, button styling, or headings.
3. Click 'Run' to preview live changes in the Live Preview tab.
4. Remember to save your modifications by clicking 'Save Project'.`,
    };
  }

  // 2. Turtle Graphics (Grade 8 or Turtle topics)
  if (
    className.includes('8') ||
    title.includes('turtle') ||
    desc.includes('turtle') ||
    subject.includes('turtle')
  ) {
    let turtleSnippet = `import turtle

# Initialize turtle
t = turtle.Turtle()
t.color("cyan")

# Draw Polygon / Geometric Pattern
for i in range(5):
    t.forward(120)
    t.right(144)
`;

    if (title.includes('circle') || title.includes('lingkaran')) {
      turtleSnippet = `import turtle
t = turtle.Turtle()
t.color("yellow")
for r in [20, 40, 60, 80]:
    t.circle(r)
    t.left(30)
`;
    } else if (title.includes('color') || title.includes('pen')) {
      turtleSnippet = `import turtle
t = turtle.Turtle()
t.color("purple")
for step in range(4):
    t.forward(100)
    t.left(90)
`;
    }

    return {
      language: 'turtle',
      starterCode: turtleSnippet,
      teacherNotes: `Teacher Guidance Notes (${teacherName}):
1. Turtle operates on a 2D coordinate plane with (0,0) at the canvas center.
2. Core commands available:
   - forward(px) / backward(px) : Move the turtle pen forward or backward
   - left(deg) / right(deg)     : Turn the pen heading
   - circle(radius)             : Draw a circle
   - color("name")              : Set stroke color (e.g. cyan, yellow, lime, pink)
3. Modify loops and turn angles to build unique geometric artworks!
4. Click 'Save Project' to save your turtle artwork.`,
    };
  }

  // 3. Grade 11 - Python OOP
  if (className.includes('11') || title.includes('oop') || title.includes('class') || title.includes('objek')) {
    return {
      language: 'python',
      starterCode: `# Module: Object-Oriented Programming (OOP)
# Teacher: ${teacherName} (${schoolName})

class Student:
    def __init__(self, name, grade_level, project_score):
        self.name = name
        self.grade_level = grade_level
        self.project_score = project_score

    def display_info(self):
        status = "Passed" if self.project_score >= 75 else "Needs Review"
        print(f"[STUDENT INFO] {self.name} | Grade: {self.grade_level} | Score: {self.project_score} | Status: {status}")

    def update_score(self, new_score):
        self.project_score = new_score
        print(f"Score for {self.name} updated to {new_score}")

# Object Instantiation Example
student1 = Student("Alden", "Grade 11", 88)
student1.display_info()

student2 = Student("Budi", "Grade 11", 94)
student2.display_info()
`,
      teacherNotes: `Teacher Guidance Notes (${teacherName}):
1. Understand 'class' as a blueprint, and 'object' as an actual instance.
2. The constructor '__init__' runs automatically upon object creation.
3. 'self' refers to the active instance.
4. Try adding new attributes (such as 'email' or 'major') and methods to the Student class.`,
    };
  }

  // 4. Grade 9 - Python Lists & Data Processing
  if (className.includes('9') || title.includes('list') || title.includes('data')) {
    return {
      language: 'python',
      starterCode: `# Module: List Manipulation & Data Processing
# Teacher: ${teacherName} (${schoolName})

students = ["Alden", "Aditya", "Chelsea", "Budi", "Dewi"]
scores = [85, 92, 78, 90, 88]

print("Enrolled Students:", students)
print("Scores List:", scores)

# 1. Add new data
students.append("Farhan")
scores.append(95)

# 2. Basic Statistical Calculations
total_score = sum(scores)
average_score = total_score / len(scores)
highest_score = max(scores)
lowest_score = min(scores)

print("\\n--- CLASS STATISTICS ---")
print(f"Total Students : {len(students)}")
print(f"Highest Score  : {highest_score}")
print(f"Lowest Score   : {lowest_score}")
print(f"Class Average  : {average_score:.2f}")
`,
      teacherNotes: `Teacher Guidance Notes (${teacherName}):
1. Python lists are ordered and mutable.
2. Use .append() to add items to the end, or .pop() to remove them.
3. Use built-in functions len(), sum(), min(), and max() for quick stats.
4. Try writing a 'for' loop to neatly print each student paired with their score.`,
    };
  }

  // 5. Grade 10 - ICT / Practical Algorithms
  if (className.includes('10') || title.includes('ict') || title.includes('algoritma') || title.includes('security')) {
    return {
      language: 'python',
      starterCode: `# Practical Computing: Algorithms & Data Validation
# Teacher: ${teacherName} (${schoolName})

def check_password_strength(password):
    length = len(password)
    has_number = any(char.isdigit() for char in password)
    
    print(f"Testing password: '{password}'")
    print(f"- Character count: {length}")
    print(f"- Contains digit : {has_number}")
    
    if length >= 8 and has_number:
        return "Strong & Secure"
    elif length >= 6:
        return "Moderate (Add digits or symbols)"
    else:
        return "Weak (Too short!)"

# Test the function with sample passwords
result = check_password_strength("Spins2026Secure")
print("Security Status:", result)
`,
      teacherNotes: `Teacher Guidance Notes (${teacherName}):
1. This exercise demonstrates IGCSE ICT Security concepts and algorithmic logic.
2. Notice the importance of input validation in modern software to prevent vulnerabilities.
3. Try expanding the function to check for special characters as well.`,
    };
  }

  // 6. Grade 7 - Python Fundamentals (Variables, Conditions, Loops)
  let pythonBasicSnippet = `# Module: Python Fundamentals
# Teacher: ${teacherName} (${schoolName})

# 1. Variable Declarations
school_name = "SPINS Interactional School"
subject = "Computer Science"
grade_level = 7
is_active = True

# 2. Output
print(f"Welcome to {subject}!")
print(f"School: {school_name} | Class: Grade {grade_level}")

# 3. Simple Conditional Structure
score = 85
if score >= 80:
    print(f"Result: Great work! Your score is {score} (Passed)")
else:
    print(f"Result: Keep practicing! Your score is {score}")
`;

  if (title.includes('loop') || title.includes('perulangan')) {
    pythonBasicSnippet = `# Module: Python Loops
# Teacher: ${teacherName}

print("=== COUNTING UP WITH FOR ===")
for i in range(1, 6):
    print(f"Line {i}: Python is awesome!")

print("\\n=== COUNTDOWN WITH WHILE ===")
number = 3
while number > 0:
    print("Countdown:", number)
    number -= 1
print("Done!")
`;
  } else if (title.includes('input') || title.includes('output')) {
    pythonBasicSnippet = `# Module: Python Input & Output
# Teacher: ${teacherName}

student_name = "Alden"
hobby = "Coding & Robotics"

print(f"Hello, my name is {student_name}.")
print(f"My hobby is {hobby}.")
print(f"Ready to learn computer science at {schoolName}!")
`;
  }

  return {
    language: 'python',
    starterCode: pythonBasicSnippet,
    teacherNotes: `Teacher Guidance Notes (${teacherName}):
1. Python is case-sensitive.
2. Ensure consistent indentation (4 spaces) within 'if' or 'for' blocks.
3. Run the code using the green 'Run' button to view results in the Console tab.
4. Feel free to experiment by modifying variables, then hit 'Save Project'.`,
  };
}
