// Monaco Editor 로드 및 설정
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' } });

require(["vs/editor/editor.main"], function () {
    // Monaco Editor 초기화
    window.editor = monaco.editor.create(document.getElementById("editor-container"), {
        value: '교주님',
        language: "python",
        theme: "vs-dark",
        automaticLayout: true
    });
});

const files = [
    'hello_world.txt',
    'gugudan.txt',
    'fibonacci.txt',
    'infinite_loop.txt',
    'syntax_error.txt',    
];

const examples = {};
const exampleBtn = document.getElementById("example-btn");
const exampleDropdown = document.getElementById("exampleDropdown");

// 파일 로드 전 버튼 비활성화
exampleBtn.disabled = true;

async function loadFiles() {
    for (const file of files) {
        const response = await fetch(`example/${file}`);
        const content = await response.text();

        const key = file.replace('.txt', '');
        examples[key] = {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            code: content
        };
    }

    // 로드 완료 후 드롭다운 업데이트
    updateDropdown();
}

function updateDropdown() {
    exampleDropdown.innerHTML = ""; // 기존 항목 초기화

    Object.keys(examples).forEach(key => {
        const item = document.createElement("div");
        item.className = "example-item";
        item.textContent = examples[key].name;
        item.setAttribute("data-example", key);

        item.addEventListener("click", function () {
            window.editor.setValue(examples[key].code);
            console.log("Example changed to:", examples[key].name);
            exampleDropdown.style.display = "none";
        });

        exampleDropdown.appendChild(item);
    });

    // 버튼 활성화
    exampleBtn.disabled = false;
}

// 파일 로드 시작
loadFiles();

// 드롭다운 표시/숨기기
exampleBtn.addEventListener("click", function () {
    exampleDropdown.style.display = exampleDropdown.style.display === "block" ? "none" : "block";
});

// 클릭이 드롭다운 외부에서 발생하면 닫기
document.addEventListener("click", function (event) {
    if (exampleDropdown.style.display === "block" && !exampleDropdown.contains(event.target) && event.target !== exampleBtn) {
        exampleDropdown.style.display = "none";
    }
});

// XTerm.js 터미널 설정
const term = new Terminal();
term.open(document.getElementById("output-terminal"));
term.writeln("Click on RUN button to see the output");

// Split.js 설정 (드래그 가능하도록)
Split(["#editor-container", "#right-panel"], {
    sizes: [65, 35], // 초기 크기 비율
    minSize: 200,    // 패널 최소 크기
    gutterSize: 6,   // 실제 보이는 구분선 크기
    cursor: "e-resize", // 기본 드래그 커서
    gutterClassName: "custom-gutter-horizontal", // 구분선 클래스 추가
});

// 입력창과 터미널 사이 분할
Split(["#input-container", "#terminal-container"], {
    direction: "vertical", // 세로 분할
    sizes: [20, 80], // 입력창 20%, 터미널 80%
    minSize: 100, // 최소 크기 제한
    gutterSize: 6, // 구분선 크기
    cursor: "n-resize",
    gutterClassName: "custom-gutter-vertical",
});

// RUN 버튼 이벤트
document.getElementById("run-btn").addEventListener("click", async () => {
    const code = editor.getValue(); // Monaco Editor에서 코드 가져오기
    const userInput = document.getElementById("stdin-input").value.trim().split("\n"); // STDIN 입력

    term.clear();
    term.writeln("코드 실행 중...\n");

    try {
        const response = await fetch("http://localhost:3000/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: code, inputs: userInput })
        });

        
        const result = await response.json();
        term.clear();
        term.writeln("jwak@jwak-server ~$ python main.py\n");
        term.writeln(result.output);
    } catch (error) {
        term.writeln("Error: Unable to connect to server.");
        console.error("Fetch error:", error);
    }
});
