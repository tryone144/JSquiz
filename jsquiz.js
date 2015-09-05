/*
 * JSquiz
 * JavaScript driven Quiz Engine
 *
 * file: jsquiz.js
 * v0.9.1 / 2015.09.05
 *
 * (c) 2015 Bernd Busse
 */

var holder, intro, result,
    progressKeeper, progress,
    notice;

function logErr(msg) {
    var text = "Fehler: " + msg;
    console.log(text);
    alert(text);
}

function validateJson(data) {
    var valid = true;

    if (data.length == 0) {
        logErr("Datei zu kurz.");
        valid = false;
    } else {
        if (!data.title) {
            logErr("Titel fehlt.");
            valid = false;
        }
        if (!data.mode) {
            logErr("Modus fehlt.");
            valid = false;
        }

        if (!data.questions || data.questions.length == 0) {
            logErr("Fragen fehlen.");
            valid = false;
        } else {
            q = data.questions;
            for (i = 0; i < q.length; i++) {
                if (!q[i].question) {
                    logErr("Frage zu Nummer " + i + " fehlt.");
                    valid = false;
                }
                if (!q[i].answers || q[i].answers.length == 0) {
                    logErr("Antworten zu Nummer " + i + " fehlen.");
                    valid = false;
                }
                if (!q[i].correct || !(q[i].correct >= 1 && q[i].correct <= q[i].answers.length)) {
                    logErr("Richtige Antwort zu Nummer " + i + " fehlt.");
                    valid = false;
                }
            }
        }
    }

    return valid;
}

function genQuestionContainer(data, index, mode) {
    var cont = $("<div>");
    cont.addClass("questionContainer");
    cont.addClass("hide");

    var teamContainer = $("<ul>");
    teamContainer.addClass("teamlist");
    if (mode == 1) {
        teamContainer.attr("style", "visibility: hidden;");
    }
    for (i = 0; i < mode; i++) {
        var team = $("<li>");
        team.addClass("team");
        team.html("Team " + String.fromCharCode(65 + i));
        
        if (i == (index % mode)) {
            team.addClass("active");
            cont.attr("data-team", i + 1);
        }
        
        teamContainer.append(team);
    }

    var question = $("<div>");
    question.addClass("question");
    question.html(data.question);

    var answers = $("<ul>");
    answers.addClass("answers");
    answers.addClass("button_container");

    for (i = 0; i < data.answers.length; i++) {
        var answer = data.answers[i];

        var ansButton = $("<button>");
        ansButton.addClass("check_button");
        ansButton.attr("data-correct", (i == data.correct - 1));
        ansButton.append(answer);

        var ansContainer = $("<li>");
        ansContainer.append(ansButton);

        answers.append(ansContainer);
    }

    var btnContainer = $("<div>");
    btnContainer.addClass("btnContainer");
    
    if (data.isFirst) {
        var div = $("<div>");
        div.addClass("prev");

        var btnExit = $("<a>");
        btnExit.attr("id", "btnExit");
        btnExit.attr("href", "#");

        btnContainer.append(div.append(btnExit));
    } else {
        var div = $("<div>");
        div.addClass("prev");

        var btnPrev = $("<a>");
        btnPrev.addClass("btnPrev");
        btnPrev.attr("href", "#");

        btnContainer.append(div.append(btnPrev));
    }

    var div = $("<div>");
    div.addClass("next");

    var btnCheck = $("<a>");
    btnCheck.addClass("btnCheck");
    btnCheck.addClass("disabled");
    btnCheck.attr("href", "#");

    div.append(btnCheck);
    
    if (!data.isLast) {
        var btnNext = $("<a>");
        btnNext.addClass("btnNext");
        btnNext.attr("href", "#");
        btnNext.hide();

        div.append(btnNext);
    } else {
        var btnFinish = $("<a>");
        btnFinish.attr("id", "btnShowResult");
        btnFinish.attr("href", "#");
        btnFinish.hide();

        div.append(btnFinish);
    }
    
    btnContainer.append(div);

    cont.append(teamContainer);
    cont.append(question);
    cont.append(answers);
    cont.append(btnContainer);
    cont.append($("<div>").addClass("clear"));

    return cont;
}

function genResultTable(mode) {
    var list = $('<table>');
    var head = $('<tr>');

    head.append($('<th>').html("Richtig"));
    head.append($('<th>').html("Prozent"));
    list.append(head);

    if (mode == 1) {
        var myQuestions = $('.questionContainer[data-team]');
        var max = myQuestions.length;
        var corr = max - myQuestions.find('.check_button.wrong').length;
        
        var row = $('<tr>');
        row.append($('<td>').html(corr + " von " + max));
        row.append($('<td>').html(Math.round(100 * corr / max) + "%"));
        list.append(row);
    } else {
        head.prepend($('<th>').html("Team"));

        for (d = 0; d < mode; d++) {
            var myQuestions = $('.questionContainer[data-team=' + (d + 1) + ']');
            var max = myQuestions.length;
            var corr = max - myQuestions.find('.check_button.wrong').length;

            var row = $('<tr>');
            row.append($('<td>').html("Team " + String.fromCharCode(65 + d)));
            row.append($('<td>').html(corr + " von " + max));
            row.append($('<td>').html(Math.round(100 * corr / max) + "%"));
            list.append(row);
        }
    }

    return list;
}

function loadQuizFromFile(file, callback) {
    console.log("Load Quiz \"" + file.name + "\" ...");

    fr = new FileReader();
    fr.onload = function(e) {
        var data;
        
        try {
            data = JSON.parse(e.target.result);
        } catch (err) {
            logErr("Kann Datei nicht lesen: " + err.message);
            callback(false, null);
            return;
        }

        valid = validateJson(data);
        callback(valid, data);
    };
    fr.readAsText(file);
}

function checkAnswer(e) {
    $(this).parents('.questionContainer').find('.check_button').each(function(index, elem) {
        var b = $(elem);
        
        if (b.attr("data-correct") == "true") {
            b.addClass("correct");
        } else if (b.hasClass("selected")) {
            b.addClass("wrong");
        }

        b.removeClass("selected");
        b.attr("style", "cursor: default;");
        b.off('click');
    });

    $(this).fadeOut(250, function() {
        $(this).siblings('.btnNext').fadeIn(250);
        $(this).siblings('#btnShowResult').fadeIn(250);
    });
}

function startQuiz(data) {
    console.log("Start Quiz \"" + data.title + "\" ...");

    q = data.questions;
    widthFactor = 100 / q.length;
    last = intro;
    
    for (c = 0; c < q.length; c++) {
        q[c].isFirst = (c == 0);
        q[c].isLast = (c == q.length - 1);
        cont = genQuestionContainer(q[c], c, data.mode);
        last.after(cont);
        last = cont;
    }

    $(document).off('keydown');
    $(document).on('keydown', quizHandler);

    $('.btnPrev').on('click', function(e) {
        $(this).parents('.questionContainer').fadeOut(500, function() {
            var prev = $(this).prev();
            prev.fadeIn(500);
            progress.animate({ width: Math.round((prev.index() - 1) * widthFactor) + "%" }, 500);
        });
    });

    $('.btnNext').on('click', function(e) {
        $(this).parents('.questionContainer').fadeOut(500, function() {
            var next = $(this).next();
            next.fadeIn(500);
            progress.animate({ width: Math.round((next.index() - 1) * widthFactor) + "%" }, 500);
        });
    });

    $('#btnShowResult').on('click', function(e) {
        $(this).parents('.questionContainer').fadeOut(500, function() {
            var table = genResultTable(data.mode);
            result.find('#result_container').html(table);

            result.fadeIn(500);
            progress.animate({ width: "100%" }, 500);
        });
    });

    var animateExit = function(evt) {
        progressKeeper.fadeOut(500);
        notice.fadeIn(500);
        $(this).parents('.questionContainer').fadeOut(500, function() {
            intro.fadeIn(500, function() {
                resetQuiz();
            });
        });
    };
    
    $('#btnExit').on('click', animateExit);
    $('#btnRetry').on('click', animateExit);

    $('.check_button').on('click', function(e) {
        var container = $(this).parents('.questionContainer');

        container.find('.btnCheck').on('click', checkAnswer);
        container.find('.btnCheck').removeClass("disabled");

        container.find('.check_button').removeClass("selected");
        $(this).addClass("selected");
    });

    progressKeeper.fadeIn(500);
    notice.fadeOut(500);
}

function resetQuiz(time, data) {
    $('.questionContainer').each(function(i, elem) {
        if (elem.id) {
            return;
        }
        elem.remove();
    });

    progress.width(0);

    $(document).off('keydown');
    $(document).on('keydown', mainHandler);
}

/* onload */
function jsquiz_onload() {
    console.log(" === [ J S q u i z ] === ");

    var fileinput = $('input[name="fileinput"]');
    var btnInput = $('#btnInput');
    var btnStart = $('#btnStart');
    
    holder = $('#main-quiz-holder');
    intro = $('#intro-container');
    result = $('#result-container');
    progressKeeper = $('#progressKeeper');
    progress = $('#progress');
    notice = $('#notice');

    var quizData;

    fileinput.on('change', function() {
        filename = fileinput.val().replace(/C:\\fakepath\\/i, '');
        
        if (filename == "") {
            btnInput.html("Keine Datei ausgewählt!");
            btnStart.prop("disabled", true);
            btnStart.html("START");
            quizData = null
            return;
        }

        btnInput.html(filename);
        loadQuizFromFile(fileinput[0].files[0], function(valid, data) {
            if (!valid) {
                btnStart.prop("disabled", true);
                btnStart.html("ungültige Datei!");
                quizData = null;
                return;
            }

            btnStart.prop("disabled", false);
            btnStart.html("Starte " + data.title);
            quizData = data;
        });
    });

    btnInput.on('click', function(e) {
        fileinput.click();
    });

    btnStart.on('click', function(e) {
        startQuiz(quizData);
        $(this).parents('#intro-container').fadeOut(500, function() {
            $(this).next().fadeIn(500);
        });
    });

    resetQuiz();

    progressKeeper.hide();
    notice.show();
}

function mainHandler(evt) {
    if (!(evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) && 
            !(evt.keyCode >= 112 && evt.keyCode <= 123)) {
        evt.preventDefault();

        switch (evt.keyCode) {
            case 76: // l
            case 79: // o
                $('#btnInput').click();
                break;
            case 13: // return
            case 32: // space
                $('#btnStart:enabled').click();
                break;
            default:
                console.log(evt);
        }
    }
}

function quizHandler(evt) {
    var selAnswer = function(index) {
        $('.questionContainer:visible li:nth-child(' + index + ') button').click();
    };

    if (!(evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey)) {
        evt.preventDefault();

        switch (evt.keyCode) {
            case 65: // a
            case 66: // b
            case 67: // c
            case 68: // d
            case 69: // e
            case 70: // f
            case 71: // g
            case 72: // h
                selAnswer(evt.keyCode - 64);
                break;
            case 49: // 1
            case 50: // 2
            case 51: // 3
            case 52: // 4
            case 53: // 5
            case 54: // 6
            case 55: // 7
            case 56: // 8
                selAnswer(evt.keyCode - 48);
                break;
            case 39: // right
            case 13: // return
            case 32: // space
            case 34: // pg_down
                $('.questionContainer:visible .btnNext:visible').click();
                $('.questionContainer:visible #btnShowResult:visible').click();
                $('.questionContainer:visible .btnCheck:visible').click();
                break;
            case 37: // left
            case 8:  // bspace
            case 33: // pg_up
                $('.questionContainer:visible .btnPrev:visible').click();
                $('.questionContainer:visible #btnExit:visible').click();
                break;
            case 27: // escape
                $('#btnRetry:visible').click();
                $('#btnExit').click();
                break;
        }
    }
}

$(document).ready(function () {
    // Check for the various File API support.
    if (!window.File || !window.FileReader || !window.Blob) {
        alert("The File APIs are not fully supported by your browser.");
    }
});

