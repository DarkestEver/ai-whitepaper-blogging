import assert from "node:assert/strict";
import { test } from "node:test";
import { categories, filterWhitepapers, findWhitepaper, whitepapers } from "../lib/catalog";
import { CATALOG_PAGE_SIZE, paginateItems } from "../lib/catalog-pagination";

test("sample catalog has unique routes and known categories", () => {
  const slugs = whitepapers.map(({ slug }) => slug);

  assert.equal(new Set(slugs).size, whitepapers.length);
  assert.ok(categories.includes("All topics"));
  assert.ok(whitepapers.every(({ category }) => categories.includes(category)));
});

test("search matches title, summary, topic, and publisher without case sensitivity", () => {
  assert.deepEqual(
    filterWhitepapers("CLOUD", "All topics").map(({ slug }) => slug),
    ["building-a-resilient-cloud-foundation", "reliable-platforms-on-lean-infrastructure"],
  );
  assert.equal(filterWhitepapers("research desk", "All topics").length, whitepapers.length);
});

test("topic and text filters are combined", () => {
  assert.deepEqual(
    filterWhitepapers("platform", "Cloud and infrastructure").map(({ slug }) => slug),
    ["reliable-platforms-on-lean-infrastructure"],
  );
  assert.deepEqual(filterWhitepapers("cloud", "Security and privacy"), []);
});

test("unknown paper slugs are not resolved", () => {
  assert.equal(findWhitepaper("not-a-real-paper"), undefined);
  assert.equal(findWhitepaper(whitepapers[0].slug), whitepapers[0]);
});

test("catalog pagination returns the requested slice and clamps invalid page numbers", () => {
  const firstPage = paginateItems(whitepapers, "1");
  const secondPage = paginateItems(whitepapers, "2");

  assert.equal(CATALOG_PAGE_SIZE, 6);
  assert.equal(firstPage.totalItems, whitepapers.length);
  assert.equal(firstPage.totalPages, 2);
  assert.equal(firstPage.currentPage, 1);
  assert.equal(firstPage.startItem, 1);
  assert.equal(firstPage.endItem, 6);
  assert.deepEqual(firstPage.items, whitepapers.slice(0, 6));
  assert.equal(secondPage.currentPage, 2);
  assert.equal(secondPage.startItem, 7);
  assert.equal(secondPage.endItem, 8);
  assert.deepEqual(secondPage.items, whitepapers.slice(6));
  assert.equal(paginateItems(whitepapers, "999").currentPage, 2);
  assert.equal(paginateItems(whitepapers, "-3").currentPage, 1);
  assert.equal(paginateItems(whitepapers, "not-a-page").currentPage, 1);
});

test("empty catalog pagination has no visible items and a valid first page", () => {
  assert.deepEqual(paginateItems([], "4"), {
    items: [],
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    startItem: 0,
    endItem: 0,
    pageNumbers: [1],
  });
});
