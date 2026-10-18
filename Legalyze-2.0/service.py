"""Legalyze 2.0 engine service — a dependency-free JSON API (stdlib only).

This exposes the Legalyze 2.0 international-law engine so the Legalyze product's
Node backend can answer "International Law" questions with it. It has NO UI of
its own — the interface is the existing Legalyze chat workspace.

    python service.py            # serves http://127.0.0.1:8100
    python service.py 8100       # explicit port

Endpoints:
    GET  /health           liveness + corpus stats
    GET  /stats            corpus statistics
    POST /ask              {"question": "..."} -> full structured answer JSON
"""
from __future__ import annotations
import sys
import json
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, str(Path(__file__).resolve().parent))

from legalyze2 import config                             # noqa: E402
from legalyze2.agents.orchestrator import Orchestrator   # noqa: E402
from legalyze2.store import corpus_store                 # noqa: E402


def _answer_payload(question: str) -> dict:
    orch = Orchestrator()
    ans = orch.run(question)
    r = getattr(orch, "last_retrieval", None)
    return {
        "question": question,
        "conclusion": ans.conclusion,
        "legal_basis": ans.legal_basis,
        "applicability": ans.applicability,
        "interpretation": ans.interpretation,
        "uncertainty": ans.uncertainty,
        "citations": [
            {"claim": c.claim, "provision_id": c.provision_id,
             "source_location": c.source_location, "quote": c.quote,
             "supported": c.supported, "reason": c.reason}
            for c in ans.citations
        ],
        "evidence": [
            {"provision_id": c.provision_id, "path": c.structural_path,
             "text": c.text, "source": c.source_location, "score": c.score}
            for c in ans.evidence_chunks
        ],
        "meta": {
            "candidate_instruments": (r.candidate_instruments if r else []),
            "needs_temporal": (r.needs_temporal if r else False),
            "dates": (r.dates if r else []),
            "as_of": getattr(orch, "last_as_of", None),
            "backend": "openai" if config.has_openai() else "offline",
        },
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        data = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass

    def do_GET(self):
        if self.path in ("/health", "/stats", "/"):
            st = corpus_store.stats()
            return self._send(200, {
                "status": "ok",
                "backend": "openai" if config.has_openai() else "offline",
                **st,
            })
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/ask":
            return self._send(404, {"error": "not found"})
        n = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(n) or b"{}")
            q = (body.get("question") or "").strip()
            if not q:
                return self._send(400, {"error": "empty question"})
            return self._send(200, _answer_payload(q))
        except Exception as e:
            return self._send(500, {"error": str(e)})


def main(port: int = 8100):
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    st = corpus_store.stats()
    print("=" * 60)
    print("  Legalyze 2.0 engine service  (International Law)")
    print("=" * 60)
    print(f"  corpus: {st['instruments']} instruments · {st['provisions']} provisions "
          f"· {st['cases']} cases")
    print(f"  models: {'OpenAI' if config.has_openai() else 'offline fallback'}")
    print(f"  api:    http://127.0.0.1:{port}  (POST /ask)")
    print("=" * 60)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        srv.shutdown()


if __name__ == "__main__":
    main(int(sys.argv[1]) if len(sys.argv) > 1 else 8100)
