"""Ask Legalyze 2.0 a question.

    python scripts/ask.py "What does Article 2(4) of the UN Charter prohibit?"
    python scripts/ask.py "Was State A (illustrative) a party to the Vienna Convention on 1 January 2010?"
"""
import _bootstrap  # noqa: F401
import sys
from legalyze2.agents import answer_question
from legalyze2 import answer as A


def main():
    q = " ".join(sys.argv[1:]).strip()
    if not q:
        q = "What does Article 2(4) of the Charter of the United Nations prohibit?"
    ans = answer_question(q)
    print("QUESTION:", q, "\n")
    print(A.render(ans))


if __name__ == "__main__":
    main()
