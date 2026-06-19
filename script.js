document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------
    // 1. STATE & STORAGE MANAGEMENT
    // -----------------------------------------
    let appState = {
        currentView: "dashboard",
        activeLessonId: 1,
        readLessons: JSON.parse(localStorage.getItem("readLessons")) || [],
        
        // Flashcards state
        flashcardDeck: [],
        currentCardIndex: 0,
        knownCards: JSON.parse(localStorage.getItem("knownCards")) || [], // Stores front text as key
        
        // Exam simulator state
        examMode: "study", // study or test
        examQuestions: [],
        selectedExamId: null,
        currentExamIndex: 0,
        examAnswers: {}, // index -> chosen option letter
        examChecked: {}, // index -> boolean (has checked answer in study mode)
        examHighScore: localStorage.getItem("examHighScore") || null
    };

    // Save states to localStorage
    const saveState = () => {
        localStorage.setItem("readLessons", JSON.stringify(appState.readLessons));
        localStorage.setItem("knownCards", JSON.stringify(appState.knownCards));
        if (appState.examHighScore !== null) {
            localStorage.setItem("examHighScore", appState.examHighScore);
        }
    };

    // -----------------------------------------
    // 2. ELEMENT SELECTORS
    // -----------------------------------------
    const menuItems = document.querySelectorAll(".menu-item");
    const viewSections = document.querySelectorAll(".view-section");
    const lessonsNav = document.getElementById("lessons-nav");
    
    // Header & Search
    const globalSearch = document.getElementById("global-search");
    const searchResults = document.getElementById("search-results");
    
    // Theme
    const themeToggle = document.getElementById("theme-toggle");

    // Helper to get lesson title without prefix
    const getLessonTitle = (title) => {
        const idx = title.indexOf("-");
        if (idx === -1) return title;
        return title.substring(idx + 1).trim();
    };
    
    // Dashboard Stats
    const statLessonsRead = document.getElementById("stat-lessons-read");
    const statFlashcardsMastered = document.getElementById("stat-flashcards-mastered");
    const statExamHighScore = document.getElementById("stat-exam-high-score");
    const btnQuickFlashcards = document.getElementById("btn-quick-flashcards");
    const btnQuickExam = document.getElementById("btn-quick-exam");
    const btnQuickGlossary = document.getElementById("btn-quick-glossary");
    
    // Glossary View elements
    const glossarySearch = document.getElementById("glossary-search");
    const glossaryList = document.getElementById("glossary-list");
    const glossaryLetterFilters = document.getElementById("glossary-letter-filters");
    const glossaryStats = document.getElementById("glossary-stats");
    const glossaryEmptyState = document.getElementById("glossary-empty-state");
    
    // Lesson View elements
    const lessonNumberBadge = document.getElementById("lesson-number-badge");
    const lessonTitleDisplay = document.getElementById("lesson-title-display");
    const lessonReadCheckbox = document.getElementById("lesson-read-checkbox");
    const lessonSummaryHtml = document.getElementById("lesson-summary-html");
    const pdfEmbedContainer = document.getElementById("pdf-embed-container");
    const pdfFallbackMsg = document.getElementById("pdf-fallback-msg");
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabPanes = document.querySelectorAll(".tab-pane");
    
    // Flashcard View elements
    const flashcardsFilter = document.getElementById("flashcards-filter");
    const flashcardProgressText = document.getElementById("flashcard-progress-text");
    const flashcardProgressFill = document.getElementById("flashcard-progress-fill");
    const flashcardBox = document.getElementById("flashcard-box");
    const cardFrontText = document.getElementById("card-front-text");
    const cardBackText = document.getElementById("card-back-text");
    const cardFrontNumber = document.getElementById("card-front-number");
    const cardBackNumber = document.getElementById("card-back-number");
    const cardFrontLesson = document.getElementById("card-front-lesson");
    const cardBackLesson = document.getElementById("card-back-lesson");
    const btnPrevCard = document.getElementById("btn-prev-card");
    const btnNextCard = document.getElementById("btn-next-card");
    const btnKnowCard = document.getElementById("btn-know-card");
    const btnReviewCard = document.getElementById("btn-review-card");
    const flashcardsEmptyState = document.getElementById("flashcards-empty-state");
    
    // Exam Simulator elements
    const examIntro = document.getElementById("exam-intro");
    const examActive = document.getElementById("exam-active");
    const examResults = document.getElementById("exam-results");
    const btnStartExam = document.getElementById("btn-start-exam");
    const examQuestionCounter = document.getElementById("exam-question-counter");
    const examProgressFill = document.getElementById("exam-progress-fill");
    const examQuestionText = document.getElementById("exam-question-text");
    const examOptionsContainer = document.getElementById("exam-options-container");
    const examFeedbackCard = document.getElementById("exam-feedback-card");
    const examFeedbackStatus = document.getElementById("exam-feedback-status");
    const examFeedbackStatusText = document.getElementById("exam-feedback-status-text");
    const examFeedbackExplanation = document.getElementById("exam-feedback-explanation");
    const btnExamPrev = document.getElementById("btn-exam-prev");
    const btnExamCheck = document.getElementById("btn-exam-check");
    const btnExamNext = document.getElementById("btn-exam-next");
    const btnExamSubmit = document.getElementById("btn-exam-submit");
    
    // Exam Results elements
    const resultsScorePercent = document.getElementById("results-score-percent");
    const resultsScoreFraction = document.getElementById("results-score-fraction");
    const resultsStatusBadge = document.getElementById("results-status-badge");
    const resultsFeedbackMessage = document.getElementById("results-feedback-message");
    const resultsTopicsProgress = document.getElementById("results-topics-progress");
    const resultsQuestionsReview = document.getElementById("results-questions-review");
    const btnRestartExam = document.getElementById("btn-restart-exam");
    const examsSelectGrid = document.getElementById("exams-select-grid");

    // Sound synthesis functions using Web Audio API
    const playCorrectSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);
            
            osc1.type = "sine";
            osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
            
            osc2.type = "sine";
            osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1); // G5
            
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            
            osc1.start(ctx.currentTime);
            osc1.stop(ctx.currentTime + 0.35);
            osc2.start(ctx.currentTime + 0.1);
            osc2.stop(ctx.currentTime + 0.35);
        } catch (e) {
            console.error("Audio failed:", e);
        }
    };

    const playIncorrectSound = () => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = "triangle";
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
            
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) {
            console.error("Audio failed:", e);
        }
    };

    // -----------------------------------------
    // 3. THEME TOGGLER
    // -----------------------------------------
    const activeTheme = localStorage.getItem("theme") || "dark";
    if (activeTheme === "light") {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
    }
    
    themeToggle.addEventListener("click", () => {
        if (document.body.classList.contains("dark-theme")) {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
            localStorage.setItem("theme", "light");
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
            localStorage.setItem("theme", "dark");
        }
    });

    // -----------------------------------------
    // 4. VIEW ROUTER
    // -----------------------------------------
    const switchView = (viewName) => {
        appState.currentView = viewName;
        
        // Hide all views, show active
        viewSections.forEach(sec => {
            sec.classList.remove("active");
            if (sec.id === `view-${viewName}`) {
                sec.classList.add("active");
            }
        });
        
        // Update menu items active class
        menuItems.forEach(item => {
            item.classList.remove("active");
            if (item.getAttribute("data-view") === viewName) {
                item.classList.add("active");
            }
        });
        
        // Reset submenus active class if not in lesson view
        if (viewName !== "lesson") {
            document.querySelectorAll(".lesson-nav-item").forEach(el => el.classList.remove("active"));
        }
        
        // Reset page scroll
        window.scrollTo(0, 0);
        
        // Trigger specific view setups
        if (viewName === "dashboard") {
            renderDashboard();
        } else if (viewName === "lessons") {
            renderLessonsGrid();
        } else if (viewName === "flashcards") {
            setupFlashcardsDeck();
        } else if (viewName === "exam") {
            initExamsSelector();
            appState.selectedExamId = null;
            btnStartExam.disabled = true;
            btnStartExam.textContent = "אנא בחרו שאלון בחינה";
        }
    };

    // Bind menu clicks
    menuItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const view = item.getAttribute("data-view");
            if (view) switchView(view);
        });
    });

    // -----------------------------------------
    // 5. SIDEBAR LESSONS RENDER
    // -----------------------------------------
    const renderSidebarLessons = () => {
        lessonsNav.innerHTML = "";
        courseData.lessons.forEach(lesson => {
            const item = document.createElement("a");
            item.className = "lesson-nav-item";
            if (appState.readLessons.includes(lesson.id)) {
                item.classList.add("read");
            }
            if (appState.activeLessonId === lesson.id && appState.currentView === "lesson") {
                item.classList.add("active");
            }
            
            item.innerHTML = `<span>שיעור ${lesson.id}: ${getLessonTitle(lesson.title)}</span>`;
            item.addEventListener("click", (e) => {
                e.preventDefault();
                loadLesson(lesson.id);
            });
            lessonsNav.appendChild(item);
        });
    };

    // -----------------------------------------
    // 5.5. LESSONS GRID RENDER (For Mobile & Desktop List View)
    // -----------------------------------------
    const renderLessonsGrid = () => {
        const gridContainer = document.getElementById("lessons-grid-container");
        if (!gridContainer) return;
        gridContainer.innerHTML = "";
        
        courseData.lessons.forEach(lesson => {
            const isRead = appState.readLessons.includes(lesson.id);
            const card = document.createElement("div");
            card.className = `lesson-grid-card ${isRead ? "read" : ""}`;
            
            // Extract a clean text description from summaryHtml by removing HTML tags
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = lesson.summaryHtml;
            const plainText = tempDiv.textContent || tempDiv.innerText || "";
            const cleanDesc = plainText.trim().substring(0, 120) + "...";
            
            card.innerHTML = `
                <div class="card-header">
                    <span class="lesson-badge">שיעור ${lesson.id}</span>
                    ${isRead ? '<span class="read-status-badge">✓ נקרא</span>' : ''}
                </div>
                <h3>${getLessonTitle(lesson.title)}</h3>
                <p class="card-description">${cleanDesc}</p>
                <button class="view-btn">קרא סיכום ומצגת ←</button>
            `;
            card.addEventListener("click", () => {
                loadLesson(lesson.id);
            });
            gridContainer.appendChild(card);
        });
    };

    // -----------------------------------------
    // 6. DASHBOARD LOGIC
    // -----------------------------------------
    const renderDashboard = () => {
        // Stats
        statLessonsRead.textContent = `${appState.readLessons.length} / 13`;
        statFlashcardsMastered.textContent = appState.knownCards.length;
        
        if (appState.examHighScore !== null) {
            statExamHighScore.textContent = `${appState.examHighScore}%`;
        } else {
            statExamHighScore.textContent = "אין נתונים";
        }
        
        // Render Topic Tags click handlers
        document.querySelectorAll(".topic-tag").forEach(tag => {
            tag.addEventListener("click", () => {
                const lessonId = parseInt(tag.getAttribute("data-lesson"));
                loadLesson(lessonId);
            });
        });
    };
    
    // Quick Actions
    btnQuickFlashcards.addEventListener("click", () => switchView("flashcards"));
    btnQuickExam.addEventListener("click", () => switchView("exam"));
    btnQuickGlossary.addEventListener("click", () => switchView("glossary"));

    // -----------------------------------------
    // 7. LESSON PAGE LOGIC
    // -----------------------------------------
    const loadLesson = (lessonId) => {
        appState.activeLessonId = lessonId;
        const lesson = courseData.lessons.find(l => l.id === lessonId);
        if (!lesson) return;
        
        // Switch view to lesson
        switchView("lesson");
        
        // Update sidebar active selection
        document.querySelectorAll(".lesson-nav-item").forEach((el, index) => {
            el.classList.remove("active");
            if (index + 1 === lessonId) {
                el.classList.add("active");
            }
        });
        
        // Title & Badges
        lessonNumberBadge.textContent = `מפגש ${lesson.id}`;
        lessonTitleDisplay.textContent = lesson.title;
        
        // Progress check
        lessonReadCheckbox.checked = appState.readLessons.includes(lessonId);
        
        // Render summary
        lessonSummaryHtml.innerHTML = lesson.summaryHtml;
        
        // Mapped questions list inside the lesson summary is deprecated
        
        // Set up Presentation
        if (lesson.presentation) {
            pdfEmbedContainer.classList.remove("hidden");
            pdfFallbackMsg.classList.remove("active");
            pdfEmbedContainer.innerHTML = `<object data="presentations/${lesson.presentation}#view=FitH" type="application/pdf" width="100%" height="100%">
                <p style="text-align:center; padding: 20px;">הדפדפן שלך לא תומך בהצגת מצגות PDF באופן מובנה. <br><br><a href="presentations/${lesson.presentation}" target="_blank" style="color:var(--primary-color); text-decoration:underline;">לחץ כאן לפתיחת המצגת בחלון חדש</a></p>
            </object>`;
        } else {
            pdfEmbedContainer.classList.add("hidden");
            pdfFallbackMsg.classList.add("active");
            pdfEmbedContainer.innerHTML = "";
            
            // Customize fallback message for lesson 13
            if (lessonId === 13) {
                pdfFallbackMsg.querySelector("p").innerHTML = `מפגש 13 הוא מפגש סיכום והכנה למבחן. <br>מומלץ לעיין במצגת של <strong>מפגש 13</strong> העוסקת בתוכניות המשכיות עסקית (BCP) ובניית תקציבים.`;
            } else {
                pdfFallbackMsg.querySelector("p").textContent = "לא נמצאה מצגת מוגדרת למפגש זה.";
            }
        }
        
        // Reset Tabs to Summary
        switchLessonTab("summary");
    };
    
    // Switch Lesson Tabs
    const switchLessonTab = (tabName) => {
        tabBtns.forEach(btn => {
            btn.classList.remove("active");
            if (btn.getAttribute("data-tab") === tabName) {
                btn.classList.add("active");
            }
        });
        
        tabPanes.forEach(pane => {
            pane.classList.remove("active");
            if (pane.id === `lesson-tab-${tabName}`) {
                pane.classList.add("active");
            }
        });
    };
    
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            switchLessonTab(btn.getAttribute("data-tab"));
        });
    });
    
    // Mark lesson as read checkbox
    lessonReadCheckbox.addEventListener("change", () => {
        const lessonId = appState.activeLessonId;
        if (lessonReadCheckbox.checked) {
            if (!appState.readLessons.includes(lessonId)) {
                appState.readLessons.push(lessonId);
            }
        } else {
            appState.readLessons = appState.readLessons.filter(id => id !== lessonId);
        }
        saveState();
        renderSidebarLessons();
        renderLessonsGrid();
        renderDashboard();
    });
    
    // Lesson knowledge check logic has been removed

    // -----------------------------------------
    // 8. FLASHCARDS LOGIC
    // -----------------------------------------
    const setupFlashcardsFilter = () => {
        flashcardsFilter.innerHTML = `<option value="all">כל השיעורים</option>`;
        courseData.lessons.forEach(l => {
            const opt = document.createElement("option");
            opt.value = l.id;
            opt.textContent = `מפגש ${l.id}: ${getLessonTitle(l.title)}`;
            flashcardsFilter.appendChild(opt);
        });
        
        flashcardsFilter.addEventListener("change", () => {
            setupFlashcardsDeck();
        });
    };
    
    const setupFlashcardsDeck = () => {
        const selectedVal = flashcardsFilter.value;
        let cards = [];
        
        if (selectedVal === "all") {
            courseData.lessons.forEach(l => {
                l.flashcards.forEach(c => {
                    cards.push({ ...c, lessonId: l.id });
                });
            });
        } else {
            const lessonId = parseInt(selectedVal);
            const lesson = courseData.lessons.find(l => l.id === lessonId);
            if (lesson) {
                lesson.flashcards.forEach(c => {
                    cards.push({ ...c, lessonId: lesson.id });
                });
            }
        }
        
        appState.flashcardDeck = cards;
        appState.currentCardIndex = 0;
        
        // Reset flip state
        flashcardBox.classList.remove("flipped");
        
        if (cards.length > 0) {
            flashcardBox.classList.remove("hidden");
            document.querySelector(".flashcard-buttons").classList.remove("hidden");
            flashcardsEmptyState.classList.add("hidden");
            renderFlashcard();
        } else {
            flashcardBox.classList.add("hidden");
            document.querySelector(".flashcard-buttons").classList.add("hidden");
            flashcardsEmptyState.classList.remove("hidden");
            flashcardProgressText.textContent = "כרטיסייה 0 מתוך 0";
            flashcardProgressFill.style.width = "0%";
        }
    };
    
    const renderFlashcard = () => {
        const card = appState.flashcardDeck[appState.currentCardIndex];
        
        // Reset flip animation instantly before switching text
        flashcardBox.style.transition = "none";
        flashcardBox.classList.remove("flipped");
        
        // Force reflow
        flashcardBox.offsetHeight;
        flashcardBox.style.transition = "";
        
        // Populate text
        cardFrontText.textContent = card.front;
        cardBackText.textContent = card.back;
        
        // Badges
        cardFrontNumber.textContent = `#${appState.currentCardIndex + 1}`;
        cardBackNumber.textContent = `#${appState.currentCardIndex + 1}`;
        cardFrontLesson.textContent = `מפגש ${card.lessonId}`;
        cardBackLesson.textContent = `מפגש ${card.lessonId}`;
        
        // Update progress
        flashcardProgressText.textContent = `כרטיסייה ${appState.currentCardIndex + 1} מתוך ${appState.flashcardDeck.length}`;
        const pct = ((appState.currentCardIndex + 1) / appState.flashcardDeck.length) * 100;
        flashcardProgressFill.style.width = `${pct}%`;
        
        // Nav buttons state
        btnPrevCard.disabled = appState.currentCardIndex === 0;
        btnNextCard.disabled = appState.currentCardIndex === appState.flashcardDeck.length - 1;
        
        // Mastery buttons state - reflect known cards
        const isMastered = appState.knownCards.includes(card.front);
        if (isMastered) {
            btnKnowCard.classList.add("active");
            btnKnowCard.style.boxShadow = `0 0 15px var(--accent-green-glow)`;
        } else {
            btnKnowCard.classList.remove("active");
            btnKnowCard.style.boxShadow = "";
        }
    };
    
    // Card flipping trigger
    flashcardBox.addEventListener("click", () => {
        flashcardBox.classList.toggle("flipped");
    });
    
    // Prev / Next card
    btnPrevCard.addEventListener("click", (e) => {
        e.stopPropagation();
        if (appState.currentCardIndex > 0) {
            appState.currentCardIndex--;
            renderFlashcard();
        }
    });
    
    btnNextCard.addEventListener("click", (e) => {
        e.stopPropagation();
        if (appState.currentCardIndex < appState.flashcardDeck.length - 1) {
            appState.currentCardIndex++;
            renderFlashcard();
        }
    });
    
    // Know / Review logic
    btnKnowCard.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = appState.flashcardDeck[appState.currentCardIndex];
        if (!appState.knownCards.includes(card.front)) {
            appState.knownCards.push(card.front);
        }
        saveState();
        renderFlashcard();
        
        // Auto go next after a short delay
        if (appState.currentCardIndex < appState.flashcardDeck.length - 1) {
            setTimeout(() => {
                if (appState.currentView === "flashcards") {
                    appState.currentCardIndex++;
                    renderFlashcard();
                }
            }, 300);
        }
    });
    
    btnReviewCard.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = appState.flashcardDeck[appState.currentCardIndex];
        appState.knownCards = appState.knownCards.filter(text => text !== card.front);
        saveState();
        renderFlashcard();
        
        if (appState.currentCardIndex < appState.flashcardDeck.length - 1) {
            setTimeout(() => {
                if (appState.currentView === "flashcards") {
                    appState.currentCardIndex++;
                    renderFlashcard();
                }
            }, 300);
        }
    });

    // -----------------------------------------
    // 9. EXAM SIMULATOR LOGIC
    // -----------------------------------------
    // Render available exams list dynamically
    const initExamsSelector = () => {
        if (!examsSelectGrid) return;
        
        examsSelectGrid.innerHTML = "";
        
        courseData.exams.forEach(exam => {
            const card = document.createElement("div");
            card.className = "exam-select-card";
            card.setAttribute("data-exam-id", exam.id);
            
            if (appState.selectedExamId === exam.id) {
                card.classList.add("selected");
            }
            
            card.innerHTML = `
                <h4>${exam.title}</h4>
                <p>${exam.description}</p>
                <div class="exam-meta">
                    <svg class="icon" style="width: 14px; height: 14px;"><use href="#icon-book"/></svg>
                    <span>${exam.questions.length} שאלות אמריקאיות</span>
                </div>
            `;
            
            card.addEventListener("click", () => {
                document.querySelectorAll(".exam-select-card").forEach(c => c.classList.remove("selected"));
                card.classList.add("selected");
                appState.selectedExamId = exam.id;
                
                // Enable the start button and change its text
                btnStartExam.disabled = false;
                btnStartExam.textContent = `התחל את ${exam.title}`;
            });
            
            examsSelectGrid.appendChild(card);
        });
    };

    // Toggle active mode styles
    const modeOptions = document.querySelectorAll(".mode-option");
    modeOptions.forEach(opt => {
        opt.addEventListener("click", () => {
            modeOptions.forEach(o => o.classList.remove("active"));
            opt.classList.add("active");
            opt.querySelector("input").checked = true;
            appState.examMode = opt.querySelector("input").value;
        });
    });
    
    // Start Exam button
    btnStartExam.addEventListener("click", () => {
        const exam = courseData.exams.find(e => e.id === appState.selectedExamId);
        if (!exam) return;
        
        appState.examQuestions = [...exam.questions]; // copy the questions
        appState.currentExamIndex = 0;
        appState.examAnswers = {};
        appState.examChecked = {};
        
        // UI Views
        examIntro.classList.add("hidden");
        examActive.classList.remove("hidden");
        examResults.classList.add("hidden");
        
        renderExamQuestion();
    });
    
    const renderExamQuestion = () => {
        const q = appState.examQuestions[appState.currentExamIndex];
        const index = appState.currentExamIndex;
        
        // Counter & progress bar
        examQuestionCounter.textContent = `שאלה ${index + 1} מתוך ${appState.examQuestions.length}`;
        const pct = ((index + 1) / appState.examQuestions.length) * 100;
        examProgressFill.style.width = `${pct}%`;
        
        // Question text
        examQuestionText.textContent = `${q.id}. ${q.question}`;
        
        // Options rendering
        examOptionsContainer.innerHTML = "";
        
        // Is it already checked (in study mode)?
        const isChecked = appState.examChecked[index] || false;
        const chosen = appState.examAnswers[index] || null;
        
        Object.keys(q.options).forEach(letter => {
            const optionText = q.options[letter];
            if (!optionText) return;
            
            const optCard = document.createElement("div");
            optCard.className = "option-card";
            optCard.setAttribute("data-letter", letter);
            
            optCard.innerHTML = `
                <div class="option-letter">${letter}</div>
                <div class="option-text">${optionText}</div>
            `;
            
            // Styling based on state
            if (chosen === letter) {
                optCard.classList.add("selected");
            }
            
            if (isChecked) {
                optCard.style.pointerEvents = "none";
                if (letter === q.answer) {
                    optCard.classList.remove("selected");
                    optCard.classList.add("correct");
                } else if (chosen === letter) {
                    optCard.classList.remove("selected");
                    optCard.classList.add("incorrect");
                }
            } else {
                // Click handler
                optCard.addEventListener("click", () => {
                    document.querySelectorAll("#exam-options-container .option-card").forEach(c => {
                        c.classList.remove("selected");
                    });
                    optCard.classList.add("selected");
                    appState.examAnswers[index] = letter;
                    
                    // Enable Check Answer or Next button
                    if (appState.examMode === "study") {
                        btnExamCheck.classList.remove("hidden");
                    }
                });
            }
            
            examOptionsContainer.appendChild(optCard);
        });
        
        // Navigation buttons adjustment
        btnExamPrev.disabled = index === 0;
        
        // Study mode vs test mode adjustments
        if (appState.examMode === "study") {
            if (isChecked) {
                btnExamCheck.classList.add("hidden");
                showExamFeedback(q);
                toggleNextOrSubmit(index);
            } else {
                btnExamCheck.classList.add("hidden"); // Only show when option is selected
                examFeedbackCard.classList.add("hidden");
                btnExamNext.classList.add("hidden");
                btnExamSubmit.classList.add("hidden");
                
                // If an option was already selected but not checked
                if (chosen) {
                    btnExamCheck.classList.remove("hidden");
                }
            }
        } else {
            // Test mode: check is always hidden, feedback is hidden, next/submit is always shown (if chosen or not)
            btnExamCheck.classList.add("hidden");
            examFeedbackCard.classList.add("hidden");
            toggleNextOrSubmit(index);
        }
    };
    
    const toggleNextOrSubmit = (index) => {
        if (index === appState.examQuestions.length - 1) {
            btnExamNext.classList.add("hidden");
            btnExamSubmit.classList.remove("hidden");
        } else {
            btnExamNext.classList.remove("hidden");
            btnExamSubmit.classList.add("hidden");
        }
    };
    
    const showExamFeedback = (q) => {
        const index = appState.currentExamIndex;
        const chosen = appState.examAnswers[index];
        const isCorrect = chosen === q.answer;
        
        examFeedbackCard.classList.remove("hidden");
        examFeedbackStatus.className = "feedback-status " + (isCorrect ? "correct" : "incorrect");
        
        examFeedbackStatusText.textContent = isCorrect ? "תשובה נכונה!" : `תשובה שגויה. התשובה הנכונה היא ${q.answer}`;
        examFeedbackExplanation.textContent = q.explanation;
        
        // Swap status icon
        examFeedbackStatus.querySelector(".status-icon use").setAttribute("href", isCorrect ? "#icon-check" : "#icon-times");
    };
    
    // Check answer button click (Study Mode)
    btnExamCheck.addEventListener("click", () => {
        const index = appState.currentExamIndex;
        const chosen = appState.examAnswers[index];
        if (!chosen) return;
        
        appState.examChecked[index] = true;
        
        // Play correct/incorrect sound
        const q = appState.examQuestions[index];
        if (chosen === q.answer) {
            playCorrectSound();
        } else {
            playIncorrectSound();
        }
        
        // Re-render to lock options and show feedback
        renderExamQuestion();
    });
    
    // Prev / Next question navigation
    btnExamPrev.addEventListener("click", () => {
        if (appState.currentExamIndex > 0) {
            appState.currentExamIndex--;
            renderExamQuestion();
        }
    });
    
    btnExamNext.addEventListener("click", () => {
        if (appState.currentExamIndex < appState.examQuestions.length - 1) {
            appState.currentExamIndex++;
            renderExamQuestion();
        }
    });
    
    // Submit Exam click
    btnExamSubmit.addEventListener("click", () => {
        submitExamResults();
    });
    
    // -----------------------------------------
    // 10. EXAM RESULTS PROCESSING
    // -----------------------------------------
    const submitExamResults = () => {
        let correctCount = 0;
        const total = appState.examQuestions.length;
        
        // Calculate scores by topic dynamically
        const topics = {};
        appState.examQuestions.forEach((q, idx) => {
            const topicName = q.category || "כללי";
            if (!topics[topicName]) {
                topics[topicName] = { correct: 0, total: 0 };
            }
            
            const chosen = appState.examAnswers[idx] || null;
            const isCorrect = chosen === q.answer;
            
            if (isCorrect) {
                correctCount++;
            }
            
            topics[topicName].total++;
            if (isCorrect) {
                topics[topicName].correct++;
            }
        });
        
        // Final Score
        const scorePercent = Math.round((correctCount / total) * 100);
        
        // Update High Score
        if (appState.examHighScore === null || scorePercent > parseInt(appState.examHighScore)) {
            appState.examHighScore = scorePercent;
            saveState();
        }
        
        // UI Views
        examActive.classList.add("hidden");
        examResults.classList.remove("hidden");
        
        // Renders
        resultsScorePercent.textContent = `${scorePercent}%`;
        resultsScoreFraction.textContent = `${correctCount} מתוך ${total}`;
        
        // Pass/Fail State (threshold = 60%)
        const passed = scorePercent >= 60;
        resultsStatusBadge.className = "status-badge " + (passed ? "pass" : "fail");
        resultsStatusBadge.textContent = passed ? "עבר" : "נכשל";
        
        resultsFeedbackMessage.innerHTML = passed 
            ? `כל הכבוד! עברת את הבחינה בהצלחה עם ציון של <strong>${scorePercent}%</strong>. אתה מוכן היטב למבחן!`
            : `הציון שקיבלת הוא <strong>${scorePercent}%</strong> (ציון המעבר הוא 60%). אנו ממליצים לעבור שוב על סיכומי השיעורים וכרטיסיות השינון של הנושאים החלשים.`;
            
        // Render topics progress bars
        let topicsHtml = "";
        Object.keys(topics).forEach(topicName => {
            const topic = topics[topicName];
            if (topic.total === 0) return;
            const topicPct = Math.round((topic.correct / topic.total) * 100);
            
            topicsHtml += `
            <div class="topic-progress-row">
                <div class="topic-progress-label">${topicName}</div>
                <div class="topic-progress-bar-wrapper">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${topicPct}%; background: ${topicPct >= 60 ? 'var(--accent-green)' : 'var(--accent-red)'}"></div>
                    </div>
                </div>
                <div class="topic-progress-percent">${topicPct}% (${topic.correct}/${topic.total})</div>
            </div>
            `;
        });
        resultsTopicsProgress.innerHTML = topicsHtml;
        
        // Render detailed questions review list
        let reviewHtml = "";
        appState.examQuestions.forEach((q, idx) => {
            const chosen = appState.examAnswers[idx] || "לא נענה";
            const isCorrect = chosen === q.answer;
            
            reviewHtml += `
            <div class="review-item ${isCorrect ? 'correct' : 'incorrect'}">
                <div class="review-q-header">
                    <div class="review-q-title">${q.id}. ${q.question}</div>
                    <div class="review-q-status ${isCorrect ? 'correct' : 'incorrect'}">
                        ${isCorrect ? 'נכון' : 'שגוי'}
                    </div>
                </div>
                <div class="review-answers-compare">
                    <p>התשובה שלך: <span class="user-ans ${isCorrect ? 'correct' : 'incorrect'}"><strong>(${chosen})</strong> ${chosen !== "לא נענה" ? (q.options[chosen] || "") : ""}</span></p>
                    ${!isCorrect ? `<p>התשובה הנכונה: <span class="correct-ans"><strong>(${q.answer})</strong> ${q.options[q.answer] || ""}</span></p>` : ''}
                </div>
                <p class="feedback-explanation"><strong>הסבר:</strong> ${q.explanation}</p>
            </div>
            `;
        });
        resultsQuestionsReview.innerHTML = reviewHtml;
    };
    
    // Restart Exam button
    btnRestartExam.addEventListener("click", () => {
        examResults.classList.add("hidden");
        examIntro.classList.remove("hidden");
        switchView("exam");
    });

    // -----------------------------------------
    // 11. GLOBAL SEARCH LOGIC
    // -----------------------------------------
    globalSearch.addEventListener("input", () => {
        const val = globalSearch.value.trim().toLowerCase();
        if (!val || val.length < 2) {
            searchResults.classList.add("hidden");
            return;
        }
        
        let matches = [];
        
        // 1. Search in lesson titles/summaries
        courseData.lessons.forEach(l => {
            // Check title
            if (l.title.toLowerCase().includes(val)) {
                matches.push({
                    type: "lesson",
                    id: l.id,
                    title: `שיעור ${l.id}: ${getLessonTitle(l.title)}`,
                    snippet: "מעבר לשיעור זה מהתפריט"
                });
            } else {
                // Check in raw summary content (we'll strip tags to search inside)
                const textOnly = l.summaryHtml.replace(/<[^>]*>/g, '').toLowerCase();
                const idx = textOnly.indexOf(val);
                if (idx !== -1) {
                    const start = Math.max(0, idx - 30);
                    const end = Math.min(textOnly.length, idx + 40);
                    let snippet = textOnly.substring(start, end).trim();
                    if (start > 0) snippet = "..." + snippet;
                    if (end < textOnly.length) snippet = snippet + "...";
                    
                    matches.push({
                        type: "lesson",
                        id: l.id,
                        title: `שיעור ${l.id}: ${getLessonTitle(l.title)}`,
                        snippet: snippet
                    });
                }
            }
        });
        
        // 2. Search in exam questions
        courseData.exams.forEach(exam => {
            exam.questions.forEach(q => {
                const qText = q.question.toLowerCase();
                const qExp = q.explanation.toLowerCase();
                let match = qText.includes(val) || qExp.includes(val);
                
                Object.values(q.options).forEach(opt => {
                    if (opt.toLowerCase().includes(val)) match = true;
                });
                
                if (match) {
                    const idx = qText.indexOf(val);
                    let snippet = "";
                    if (idx !== -1) {
                        const start = Math.max(0, idx - 20);
                        const end = Math.min(q.question.length, idx + 50);
                        snippet = q.question.substring(start, end).trim();
                    } else {
                        snippet = q.explanation.substring(0, 70).trim();
                    }
                    
                    matches.push({
                        type: "exam",
                        id: q.id,
                        examId: exam.id,
                        title: `שאלה ${q.id} מתוך ${exam.title}`,
                        snippet: snippet
                    });
                }
            });
        });
        
        // Render Search Results
        renderSearchResults(matches);
    });
    
    const renderSearchResults = (matches) => {
        searchResults.innerHTML = "";
        if (matches.length === 0) {
            searchResults.innerHTML = `<div class="search-result-item" style="color: var(--text-muted);">לא נמצאו תוצאות תואמות.</div>`;
            searchResults.classList.remove("hidden");
            return;
        }
        
        matches.slice(0, 6).forEach(m => {
            const item = document.createElement("div");
            item.className = "search-result-item";
            item.innerHTML = `
                <div class="result-title">${m.title}</div>
                <div class="result-snippet">${m.snippet}</div>
            `;
            
            item.addEventListener("click", () => {
                searchResults.classList.add("hidden");
                globalSearch.value = "";
                
                if (m.type === "lesson") {
                    loadLesson(m.id);
                } else if (m.type === "exam") {
                    appState.selectedExamId = m.examId;
                    switchView("exam");
                    initExamsSelector();
                    btnStartExam.disabled = false;
                    btnStartExam.textContent = `התחל את ${courseData.exams.find(e => e.id === m.examId).title}`;
                }
            });
            searchResults.appendChild(item);
        });
        
        searchResults.classList.remove("hidden");
    };
    
    // Close search dropdown on click outside
    document.addEventListener("click", (e) => {
        if (!globalSearch.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add("hidden");
        }
    });

    // -----------------------------------------
    // GLOSSARY LOGIC
    // -----------------------------------------
    let activeGlossaryLetter = "all";

    const renderGlossary = () => {
        const terms = courseData.glossary || [];
        const query = glossarySearch ? glossarySearch.value.trim().toLowerCase() : "";

        const filtered = terms.filter(t => {
            const matchesLetter = activeGlossaryLetter === "all" ||
                t.term.toUpperCase().startsWith(activeGlossaryLetter);
            const matchesSearch = !query ||
                t.term.toLowerCase().includes(query) ||
                t.definition.toLowerCase().includes(query);
            return matchesLetter && matchesSearch;
        });

        glossaryList.innerHTML = "";
        glossaryEmptyState.classList.toggle("hidden", filtered.length > 0);
        glossaryStats.textContent = `${filtered.length} מושגים מתוך ${terms.length}`;

        filtered.forEach(t => {
            const card = document.createElement("div");
            card.className = "glossary-card";
            card.innerHTML = `
                <div class="glossary-card-header">
                    <span class="glossary-term">${t.term}</span>
                    <span class="glossary-lesson-badge">מפגש ${t.lesson}</span>
                </div>
                <p class="glossary-definition">${t.definition}</p>
            `;
            glossaryList.appendChild(card);
        });
    };

    const initGlossaryLetterFilters = () => {
        const terms = courseData.glossary || [];
        // Collect first chars
        const letters = new Set();
        terms.forEach(t => {
            const first = t.term[0].toUpperCase();
            letters.add(first);
        });
        const sorted = ["all", ...Array.from(letters).sort()];

        glossaryLetterFilters.innerHTML = "";
        sorted.forEach(letter => {
            const btn = document.createElement("button");
            btn.className = "glossary-letter-btn" + (letter === "all" ? " active" : "");
            btn.textContent = letter === "all" ? "הכל" : letter;
            btn.addEventListener("click", () => {
                activeGlossaryLetter = letter;
                document.querySelectorAll(".glossary-letter-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                renderGlossary();
            });
            glossaryLetterFilters.appendChild(btn);
        });
    };

    if (glossarySearch) {
        glossarySearch.addEventListener("input", renderGlossary);
    }

    initGlossaryLetterFilters();
    renderGlossary();

    // Initialize the app view
    renderSidebarLessons();
    setupFlashcardsFilter();
    switchView("dashboard");
});
