"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCache = void 0;
/**
 * A Least Recently Used (LRU) cache that evicts the least recently
 * accessed entries when the cache is full.
 *
 * @example
 * ```ts
 * const cache = new LRUCache<number>({ maxSize: 3 });
 * cache.set("a", 1);
 * cache.set("b", 2);
 * cache.set("c", 3);
 * cache.get("a"); // moves "a" to most recent
 * cache.set("d", 4); // evicts "b" (least recently used)
 * cache.has("b"); // => false
 * ```
 */
class LRUCache {
    _maxSize;
    _map = new Map();
    _head = null;
    _tail = null;
    constructor(options = {}) {
        this._maxSize = Math.max(1, options.maxSize ?? 100);
    }
    /**
     * Get a value and mark it as recently used.
     *
     * @param key - The cache key.
     * @returns The value or undefined.
     */
    get(key) {
        const node = this._map.get(key);
        if (!node) {
            return undefined;
        }
        this._moveToHead(node);
        return node.value;
    }
    /**
     * Set a value in the cache.
     *
     * @param key - The cache key.
     * @param value - The value to cache.
     */
    set(key, value) {
        const existing = this._map.get(key);
        if (existing) {
            existing.value = value;
            this._moveToHead(existing);
            return;
        }
        const node = { key, value, prev: null, next: null };
        this._map.set(key, node);
        this._addToHead(node);
        if (this._map.size > this._maxSize) {
            this._evict();
        }
    }
    /**
     * Check if a key exists (without affecting recency).
     */
    has(key) {
        return this._map.has(key);
    }
    /**
     * Delete a key from the cache.
     */
    delete(key) {
        const node = this._map.get(key);
        if (!node) {
            return false;
        }
        this._removeNode(node);
        this._map.delete(key);
        return true;
    }
    /**
     * Clear the cache entirely.
     */
    clear() {
        this._map.clear();
        this._head = null;
        this._tail = null;
    }
    /** Current number of entries. */
    get size() {
        return this._map.size;
    }
    /** Get all keys in order from most to least recently used. */
    keys() {
        const result = [];
        let node = this._head;
        while (node) {
            result.push(node.key);
            node = node.next;
        }
        return result;
    }
    /** Add a node to the head of the list. */
    _addToHead(node) {
        node.prev = null;
        node.next = this._head;
        if (this._head) {
            this._head.prev = node;
        }
        this._head = node;
        if (!this._tail) {
            this._tail = node;
        }
    }
    /** Remove a node from the list. */
    _removeNode(node) {
        if (node.prev) {
            node.prev.next = node.next;
        }
        else {
            this._head = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        }
        else {
            this._tail = node.prev;
        }
    }
    /** Move an existing node to the head. */
    _moveToHead(node) {
        this._removeNode(node);
        this._addToHead(node);
    }
    /** Evict the least recently used (tail) node. */
    _evict() {
        if (this._tail) {
            this._map.delete(this._tail.key);
            this._removeNode(this._tail);
        }
    }
}
exports.LRUCache = LRUCache;
//# sourceMappingURL=lru-cache.js.map