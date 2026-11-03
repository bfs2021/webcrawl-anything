import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { responseLooksLikeDocument } from "../parse/detect.js";

// The fixture's decoded head is what an HTML-tier fetch would see: the
// %PDF- signature survives UTF-8 decoding because it is pure ASCII.
const pdfHead = new TextDecoder().decode(
  readFileSync(new URL("./fixtures/tiny.pdf", import.meta.url)).slice(0, 16)
);

describe("responseLooksLikeDocument", () => {
  it("routes a declared application/pdf response to the documents pipeline", () => {
    assert.equal(responseLooksLikeDocument("application/pdf", pdfHead), true);
    assert.equal(responseLooksLikeDocument("application/pdf;charset=utf-8", ""), true);
  });

  it("routes extension-less PDFs by the %PDF- magic bytes", () => {
    assert.equal(responseLooksLikeDocument(undefined, pdfHead), true);
    assert.equal(responseLooksLikeDocument("", pdfHead), true);
    assert.equal(responseLooksLikeDocument("text/html", pdfHead), true);
  });

  it("routes generic octet-stream responses so the bytes decide", () => {
    assert.equal(responseLooksLikeDocument("application/octet-stream", ""), true);
  });

  it("routes other binary kinds (Office, images, media) by content type", () => {
    assert.equal(
      responseLooksLikeDocument(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ""
      ),
      true
    );
    assert.equal(responseLooksLikeDocument("image/png", ""), true);
  });

  it("keeps HTML and text on the HTML pipeline", () => {
    assert.equal(responseLooksLikeDocument("text/html; charset=utf-8", "<!DOCTYPE html>"), false);
    assert.equal(responseLooksLikeDocument("application/json", '{"ok":true}'), false);
    assert.equal(responseLooksLikeDocument(undefined, "<html><body>hi"), false);
    assert.equal(responseLooksLikeDocument(undefined, ""), false);
  });
});
