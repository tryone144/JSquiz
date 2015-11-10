#!/usr/bin/env python3
#
# JSquiz
# Quiz-Generator for JSquiz
#
# file: tools/generator.py
# v1.0 / 2015.11.10
#
# (c) 2015 Bernd Busse
#

import sys
import os.path
import json


def promptString(prompt=": "):
    raw = ""
    while True:
        try:
            raw = input(prompt)
        except KeyboardInterrupt:
            print("CTRL-C: Interrupted by user", file=sys.stderr)
            sys.exit(2)

        if raw != "":
            return raw


def promptFilename(prompt=": ", extension=None):
    fname = ""
    while True:
        fname = os.path.abspath(promptString(prompt))

        if extension is not None and os.path.splitext(fname)[1] == "":
            fname += os.path.extsep + extension

        if os.path.exists(fname):
            print("File \"{0}\" allready exists.".format(fname))
            overwrite = promptBool("Override? [y/N] ", False)
            if overwrite:
                print("Warning: Overriding existing file!")
                return fname
        else:
            return fname


def promptInt(prompt=": ", default=0, positive=False):
    raw = ""
    key = 0
    while True:
        try:
            raw = input(prompt)
            key = int(raw)
        except KeyboardInterrupt:
            print("CTRL-C: Interrupted by user", file=sys.stderr)
            sys.exit(2)
        except ValueError:
            if raw == "":
                return default
            else:
                continue

        if positive and key >= 0 or not positive:
            return key


def promptIntInList(prompt=": ", choices=()):
    raw = ""
    key = -1
    while True:
        try:
            raw = input(prompt)
            key = int(raw)
        except KeyboardInterrupt:
            print("CTRL-C: Interrupted by user", file=sys.stderr)
            sys.exit(2)
        except ValueError:
            continue

        if key in choices:
            return key


def promptBool(prompt="[y/N] ", default=False):
    raw = ""
    while True:
        try:
            raw = input(prompt)
        except KeyboardInterrupt:
            print("CTRL-C: Interrupted by user", file=sys.stderr)
            sys.exit(2)

        if default:
            if (raw == "n" or raw == "N"):
                return False
            else:
                return True
        else:
            if (raw == "y" or raw == "Y"):
                return True
            else:
                return False


def printErrLoad(msg):
    print("Error: Cannot load file: {0}".format(msg),
          file=sys.stderr, flush=True)


def checkIntegrity(data):
    if "title" not in data:
        printErrLoad("Title is missing")
        return False
    elif "questions" not in data:
        printErrLoad("Missing questions")
        return False

    for i, q in enumerate(data["questions"]):
        if "question" not in q:
            printErrLoad("Questiontitle for Question {0} missing".format(i))
            return False
        elif "answers" not in q or len(q["answers"]) == 0:
            printErrLoad("Answers for Question {0} missing".format(i))
            return False
        elif "correct" not in q or \
                q["correct"] < 1 or q["correct"] > len(q["answers"]):
            printErrLoad("Correct answer for Question {0} missing".format(i))
            return False

    return True


def printSummary(data, fname, extensive=False):
    print("Summary [ {0} ]:".format(fname))
    print("  Title: {0}".format(data["title"]))
    print("  # Groups: {0}".format(data["mode"]))
    print("  # Questions: {0}".format(len(data["questions"])))

    for i, q in enumerate(data["questions"]):
        print("    {0:2d}: {1}".format(i + 1, q["question"]))

        if extensive:
            printAnswers(q, indentation=8)


def printQuestionSummary(question, index, count=True):
    print("Question #{0}:".format(index))
    print("  Text: {0}".format(question["question"]))
    print("  # Answers: {0}".format(len(question["answers"])))
    printAnswers(question, count=count, indentation=4)


def printAnswers(question, count=False, indentation=1):
    for i, a in enumerate(question["answers"]):
        correct = "(X)" if i + 1 == question["correct"] else ""
        sign = "{0:2d}:".format(i + 1) if count else "-"
        print(" " * indentation + "{0} {1} {2}".format(sign, a, correct))


def editQuestion(question, index, new=False):
    changed = new

    if not new:
        print()
        printQuestionSummary(question, index)
        print()

    while True:
        print(" -- Edit Question #{0} -- ".format(index))
        print(" (1) Show Question")
        print(" (3) Edit Text")
        print(" (4) Add Answer")
        print(" (5) Edit Answer")
        print(" (6) Remove Answer")
        print(" (7) Set Correct Answer")
        print(" (9) Done...")
        print(" (0) Abbort...")

        choice = 0

        try:
            choice = promptIntInList("Select: ",
                                     choices=(1, 3, 4, 5, 6, 7, 9, 0))
        except EOFError:
            choice = 0

        # Abbort without saving
        if choice == 0:
            if changed:
                try:
                    if promptBool("Abbort and discard changes? [y/N] ",
                                  default=False):
                        return False
                except EOFError:
                    print("Abborted!")
                    print()
                    continue
            else:
                return False
        # Return and save
        elif choice == 9:
            return True

        # Show All Answers
        elif choice == 1:
            print()
            printQuestionSummary(question, index)

        # Edit Question Text
        elif choice == 3:
            print()
            try:
                text = promptString("Enter new Question: ")
            except EOFError:
                print("Abborted!")
                print()
                continue

            question["question"] = text
            changed = True
        # Add new Answer
        elif choice == 4:
            print()
            last = len(question["answers"])
            pos = last + 1
            try:
                pos = promptInt("Position to add: (default {0}) ".format(pos),
                                default=pos, positive=True)
                ans = promptString("Answer: ")
            except EOFError:
                print("Abborted!")
                print()
                continue
            question["answers"].insert(pos - 1, ans)
            changed = True
        # Edit Answer
        elif choice == 5:
            print()
            valindex = [i for i in range(1, len(question["answers"]) + 1)]
            sel = 1
            try:
                sel = promptIntInList("Answer Number: ", choices=valindex)
                ans = promptString("New Answer: ")
            except EOFError:
                print("Abborted!")
                print()
                continue

            question["answers"][sel - 1] = ans
            changed = True
        # Remove Answer
        elif choice == 6:
            print()
            valindex = [i for i in range(1, len(question["answers"]) + 1)]
            sel = 1
            try:
                sel = promptIntInList("Answer Number: ", choices=valindex)
            except EOFError:
                print("Abborted!")
                print()
                continue

            old = question["answers"].pop(sel - 1)
            print("==> Deleted Answer #{0} \"{1}\"".format(sel, old))
            if question["correct"] > sel:
                question["correct"] = question["correct"] - 1
            elif question["correct"] == sel:
                print("==> Deleted correct answer. Marked first as correct!")
                question["correct"] = 1
            changed = True
        # Set Correct Answer
        elif choice == 7:
            print()
            valindex = [i for i in range(1, len(question["answers"]) + 1)]
            sel = 1
            try:
                sel = promptIntInList("Answer Number: ", choices=valindex)
            except EOFError:
                print("Abborted!")
                print()
                continue
            question["correct"] = sel
            changed = True

        print()


def manageQuiz(fname, create=False):
    quizData = {'title': "", 'mode': 1, 'questions': []}
    base = os.path.basename(fname)
    changed = create

    if not create:
        with open(fname, 'r') as infile:
            quizData = json.load(infile)

        if not checkIntegrity(quizData):
            return 1

        print()
        printSummary(quizData, fname)
        print()

    while True:
        print(" -- Edit [ {0} ] -- ".format(base))
        print(" (1) Short overview")
        print(" (2) Show complete List")
        print(" (3) Edit Title")
        print(" (4) Add Question")
        print(" (5) Edit Question")
        print(" (6) Remove Question")
        print(" (7) Change Mode")
        print(" (9) Save...")
        print(" (0) Quit...")

        choice = 0

        try:
            choice = promptIntInList("Select: ",
                                     choices=(1, 2, 3, 4, 5, 6, 7, 9, 0))
        except EOFError:
            choice = 0

        # Quit without saving
        if choice == 0:
            if changed:
                print("You have unsaved changes.")
                try:
                    if promptBool("Quit without saving? [y/N] ",
                                  default=False):
                        return
                except EOFError:
                    print("Abborted!")
                    print()
                    continue
            else:
                return
        # Save changes
        elif choice == 9:
            try:
                if promptBool("Save Changes? [y/N] ", default=False):
                    with open(fname, 'w') as outfile:
                        json.dump(quizData, outfile, indent=4)
                    print("==> File saved!")
                    changed = False
            except EOFError:
                print("Abborted!")
                print()
                continue

        # Show short summary
        elif choice == 1:
            print()
            printSummary(quizData, fname)
        # Show all Questions
        elif choice == 2:
            print()
            printSummary(quizData, fname, extensive=True)

        # Edit Quiz Title
        elif choice == 3:
            print()
            try:
                title = promptString("Enter new Title: ")
            except EOFError:
                print("Abborted!")
                print()
                continue

            quizData["title"] = title
            changed = True
        # Add new Question
        elif choice == 4:
            print()
            last = len(quizData["questions"])
            pos = last + 1
            q = {'question': "", 'correct': 0, 'answers': []}
            try:
                pos = promptInt("Position to add: (default {0}) ".format(pos),
                                default=pos, positive=True)
                text = promptString("Question: ")
                answer = promptString("First answer: ")
                print("Set first answer to correct by default")

                q["question"] = text
                q["correct"] = 1
                q["answers"].append(answer)
            except EOFError:
                print("Abborted!")
                print()
                continue

            print()
            if editQuestion(q, pos, new=True):
                quizData["questions"].insert(pos - 1, q)
                changed = True
        # Edit Question
        elif choice == 5:
            print()
            valindex = [i for i in range(1, len(quizData["questions"]) + 1)]
            sel = 1
            try:
                sel = promptIntInList("Question Number: ", choices=valindex)
            except EOFError:
                print("Abborted!")
                print()
                continue

            data = quizData["questions"].pop(sel - 1)
            save = data.copy()
            if editQuestion(data, sel, new=False):
                quizData["questions"].insert(sel - 1, data)
                changed = True
            else:
                quizData["questions"].insert(sel - 1, save)
        # Delete Question
        elif choice == 6:
            print()
            valindex = [i for i in range(1, len(quizData["questions"]) + 1)]
            sel = 1
            try:
                sel = promptIntInList("Question Number: ", choices=valindex)
            except EOFError:
                print("Abborted!")
                print()
                continue

            old = quizData["questions"].pop(sel - 1)
            print("==> Deleted Question #{0} \"{1}\"".format(sel,
                                                             old["question"]))
            changed = True
        # Change Mode
        elif choice == 7:
            print()
            sel = 1
            try:
                sel = promptIntInList("Group count: ", choices=(1, 2, 3, 4))
            except EOFError:
                print("Abborted!")
                print()
                continue
            quizData["mode"] = sel
            print("==> Set Mode to {0} Groups".format(sel))
            changed = True

        print()


def main():

    print(" === [ JSquiz - Generator ] === ")
    print()

    if len(sys.argv) == 1:
        print("==> Generating new Quiz...")
        fname = ""

        print("Please specify a filename")
        fname = promptFilename("New Filename: ", extension="quiz")

        print("==> Generating new File: \"{0}\" ...".format(fname))
        return manageQuiz(fname, create=True)
    elif len(sys.argv) == 2:
        fname = os.path.abspath(sys.argv[1])
        if os.path.exists(fname):
            print("==> Loading File: \"{0}\" ...".format(fname))
            return manageQuiz(fname, create=False)
        else:
            print("==> Generating new File: \"{0}\" ...".format(fname))
            return manageQuiz(fname, create=True)
    else:
        print("Too many arguments", file=sys.stderr)
        return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
