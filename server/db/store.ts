import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { env } from '../config/env.ts';

type PlainDoc = Record<string, any>;

const DB_FILE = path.join(env.DATA_DIR, 'unihub-store.json');

interface StoreState {
  collections: Record<string, PlainDoc[]>;
}

const state: StoreState = {
  collections: {},
};

let initialized = false;
const modelRegistry = new Map<string, LocalModel<any>>();

export function generateObjectId(): string {
  return crypto.randomBytes(12).toString('hex');
}

function ensureDataDir() {
  if (!fs.existsSync(env.DATA_DIR)) {
    fs.mkdirSync(env.DATA_DIR, { recursive: true });
  }
}

export function loadLocalStore() {
  if (initialized) return;
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.collections) {
        state.collections = parsed.collections;
      }
    } catch {
      state.collections = {};
    }
  }
  initialized = true;
}

function persistStore() {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function getCollection(name: string): PlainDoc[] {
  loadLocalStore();
  if (!state.collections[name]) {
    state.collections[name] = [];
  }
  return state.collections[name];
}

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function getNestedValue(obj: any, keyPath: string): any {
  const parts = keyPath.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
}

function setNestedValue(obj: any, keyPath: string, value: any): void {
  const parts = keyPath.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!curr[parts[i]] || typeof curr[parts[i]] !== 'object') {
      curr[parts[i]] = {};
    }
    curr = curr[parts[i]];
  }
  curr[parts[parts.length - 1]] = value;
}

function matchesCondition(docValue: any, condition: any): boolean {
  if (condition && typeof condition === 'object' && !(condition instanceof Date) && !Array.isArray(condition)) {
    const keys = Object.keys(condition);
    const isOperatorObj = keys.some((k) => k.startsWith('$'));
    if (isOperatorObj) {
      for (const op of keys) {
        const target = condition[op];
        if (op === '$in') {
          const arr = Array.isArray(target) ? target.map(String) : [];
          if (Array.isArray(docValue)) {
            if (!docValue.some((v) => arr.includes(String(v)))) return false;
          } else {
            if (!arr.includes(String(docValue))) return false;
          }
        } else if (op === '$nin') {
          const arr = Array.isArray(target) ? target.map(String) : [];
          if (Array.isArray(docValue)) {
            if (docValue.some((v) => arr.includes(String(v)))) return false;
          } else if (arr.includes(String(docValue))) {
            return false;
          }
        } else if (op === '$ne') {
          if (String(docValue) === String(target)) return false;
        } else if (op === '$gt') {
          if (!(docValue > target)) return false;
        } else if (op === '$gte') {
          if (!(docValue >= target)) return false;
        } else if (op === '$lt') {
          if (!(docValue < target)) return false;
        } else if (op === '$lte') {
          if (!(docValue <= target)) return false;
        } else if (op === '$exists') {
          const exists = docValue !== undefined && docValue !== null;
          if (Boolean(target) !== exists) return false;
        } else if (op === '$regex') {
          const flags = condition.$options || 'i';
          const regex = target instanceof RegExp ? target : new RegExp(String(target), flags);
          if (!regex.test(String(docValue ?? ''))) return false;
        }
      }
      return true;
    }
  }

  if (condition instanceof RegExp) {
    return condition.test(String(docValue ?? ''));
  }

  if (Array.isArray(docValue) && !Array.isArray(condition)) {
    return docValue.some((v) => String(v) === String(condition));
  }

  if (docValue === condition) return true;
  if (docValue != null && condition != null && String(docValue) === String(condition)) return true;
  return false;
}

function matchesFilter(doc: PlainDoc, filter: PlainDoc = {}): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (key === '$or' && Array.isArray(value)) {
      const anyMatch = value.some((sub) => matchesFilter(doc, sub));
      if (!anyMatch) return false;
      continue;
    }
    if (key === '$and' && Array.isArray(value)) {
      const allMatch = value.every((sub) => matchesFilter(doc, sub));
      if (!allMatch) return false;
      continue;
    }
    if (value === undefined) continue;
    const docVal = getNestedValue(doc, key);
    if (!matchesCondition(docVal, value)) return false;
  }
  return true;
}

function applyDefaults(schema: mongoose.Schema, input: PlainDoc): PlainDoc {
  const doc: PlainDoc = clone(input);
  if (!doc._id) {
    doc._id = generateObjectId();
  } else {
    doc._id = String(doc._id);
  }
  schema.eachPath((pathname, schemaType: any) => {
    if (pathname === '_id' || pathname === '__v') return;
    const current = getNestedValue(doc, pathname);
    if (current === undefined) {
      if (schemaType.defaultValue !== undefined) {
        const defVal = typeof schemaType.defaultValue === 'function' ? schemaType.defaultValue() : clone(schemaType.defaultValue);
        setNestedValue(doc, pathname, defVal);
      } else if (schemaType.instance === 'Array') {
        setNestedValue(doc, pathname, []);
      }
    }
  });
  const now = new Date().toISOString();
  if (!doc.createdAt) doc.createdAt = now;
  if (!doc.updatedAt) doc.updatedAt = now;
  return doc;
}

function applyUpdate(doc: PlainDoc, update: PlainDoc): PlainDoc {
  const updated = clone(doc);
  const hasOperators = Object.keys(update).some((k) => k.startsWith('$'));
  if (!hasOperators) {
    for (const [k, v] of Object.entries(update)) {
      if (k !== '_id') updated[k] = clone(v);
    }
  } else {
    if (update.$set) {
      for (const [k, v] of Object.entries(update.$set)) {
        setNestedValue(updated, k, clone(v));
      }
    }
    if (update.$unset) {
      for (const k of Object.keys(update.$unset)) {
        delete updated[k];
      }
    }
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        const cur = Number(getNestedValue(updated, k) || 0);
        setNestedValue(updated, k, cur + Number(v));
      }
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        const cur = getNestedValue(updated, k);
        const arr = Array.isArray(cur) ? cur : [];
        if (v && typeof v === 'object' && '$each' in (v as any)) {
          arr.push(...clone((v as any).$each));
        } else {
          arr.push(clone(v));
        }
        setNestedValue(updated, k, arr);
      }
    }
    if (update.$addToSet) {
      for (const [k, v] of Object.entries(update.$addToSet)) {
        const cur = getNestedValue(updated, k);
        const arr = Array.isArray(cur) ? cur : [];
        if (!arr.some((item) => String(item) === String(v))) {
          arr.push(clone(v));
        }
        setNestedValue(updated, k, arr);
      }
    }
  }
  updated.updatedAt = new Date().toISOString();
  return updated;
}

class LocalQuery<T = PlainDoc> {
  private modelName: string;
  private schema: mongoose.Schema;
  private filter: PlainDoc;
  private isSingle: boolean;
  private sortSpec: Record<string, 1 | -1> | null = null;
  private limitCount: number | null = null;
  private skipCount = 0;
  private populates: Array<{ path: string; select?: string }> = [];
  private selectSpec: string | null = null;

  constructor(modelName: string, schema: mongoose.Schema, filter: PlainDoc, isSingle = false) {
    this.modelName = modelName;
    this.schema = schema;
    this.filter = filter;
    this.isSingle = isSingle;
  }

  sort(spec: Record<string, 1 | -1 | 'asc' | 'desc'> | string) {
    if (typeof spec === 'string') {
      const obj: Record<string, 1 | -1> = {};
      for (const token of spec.split(/\s+/).filter(Boolean)) {
        if (token.startsWith('-')) obj[token.slice(1)] = -1;
        else obj[token] = 1;
      }
      this.sortSpec = obj;
    } else {
      const obj: Record<string, 1 | -1> = {};
      for (const [k, v] of Object.entries(spec)) {
        obj[k] = v === -1 || v === 'desc' ? -1 : 1;
      }
      this.sortSpec = obj;
    }
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  skip(n: number) {
    this.skipCount = n;
    return this;
  }

  select(spec: string) {
    this.selectSpec = spec;
    return this;
  }

  populate(pathOrObj: string | { path: string; select?: string }, select?: string) {
    if (typeof pathOrObj === 'string') {
      this.populates.push({ path: pathOrObj, select });
    } else if (pathOrObj && typeof pathOrObj === 'object') {
      this.populates.push(pathOrObj);
    }
    return this;
  }

  lean() {
    return this;
  }

  private resolvePopulate(doc: PlainDoc): PlainDoc {
    const out = clone(doc);
    for (const pop of this.populates) {
      const schemaPath: any = this.schema.path(pop.path);
      let refModelName: string | undefined = schemaPath?.options?.ref;
      if (!refModelName && schemaPath?.caster?.options?.ref) {
        refModelName = schemaPath.caster.options.ref;
      }
      if (!refModelName) continue;
      const targetModel = modelRegistry.get(refModelName);
      if (!targetModel) continue;

      const rawVal = getNestedValue(out, pop.path);
      if (!rawVal) continue;

      const applySelect = (targetDoc: PlainDoc | null) => {
        if (!targetDoc) return null;
        if (!pop.select) return targetDoc;
        const fields = pop.select.split(/\s+/).filter(Boolean);
        const excludes = fields.filter((f) => f.startsWith('-')).map((f) => f.slice(1));
        const includes = fields.filter((f) => !f.startsWith('-'));
        const res = clone(targetDoc);
        if (includes.length > 0) {
          const picked: PlainDoc = { _id: res._id };
          for (const f of includes) picked[f] = res[f];
          return picked;
        }
        for (const f of excludes) delete res[f];
        return res;
      };

      if (Array.isArray(rawVal)) {
        const populatedArr = rawVal
          .map((id) => targetModel.rawFindById(String(id)))
          .filter(Boolean)
          .map((d) => applySelect(d!));
        setNestedValue(out, pop.path, populatedArr);
      } else {
        const found = targetModel.rawFindById(String(rawVal));
        if (found) {
          setNestedValue(out, pop.path, applySelect(found));
        }
      }
    }

    if (this.selectSpec) {
      const fields = this.selectSpec.split(/\s+/).filter(Boolean);
      const excludes = fields.filter((f) => f.startsWith('-')).map((f) => f.slice(1));
      const includes = fields.filter((f) => !f.startsWith('-'));
      if (includes.length > 0) {
        const picked: PlainDoc = { _id: out._id };
        for (const f of includes) picked[f] = out[f];
        return picked;
      }
      for (const f of excludes) delete out[f];
    }

    return out;
  }

  async exec(): Promise<any> {
    const col = getCollection(this.modelName);
    let results = col.filter((d) => matchesFilter(d, this.filter)).map((d) => clone(d));

    if (this.sortSpec) {
      const entries = Object.entries(this.sortSpec);
      results.sort((a, b) => {
        for (const [field, dir] of entries) {
          const av = getNestedValue(a, field);
          const bv = getNestedValue(b, field);
          if (av === bv) continue;
          if (av === undefined || av === null) return 1;
          if (bv === undefined || bv === null) return -1;
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
        }
        return 0;
      });
    }

    if (this.skipCount > 0) {
      results = results.slice(this.skipCount);
    }
    if (this.limitCount !== null) {
      results = results.slice(0, this.limitCount);
    }

    const hydrated = results.map((d) => {
      const pop = this.resolvePopulate(d);
      return attachSaveHelper(this.modelName, pop);
    });

    if (this.isSingle) {
      return hydrated[0] || null;
    }
    return hydrated;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled, onrejected);
  }
}

function attachSaveHelper(modelName: string, doc: PlainDoc): PlainDoc {
  Object.defineProperty(doc, 'save', {
    value: async function () {
      const col = getCollection(modelName);
      const idx = col.findIndex((item) => String(item._id) === String(this._id));
      const clean = clone(this);
      clean.updatedAt = new Date().toISOString();
      if (idx >= 0) {
        col[idx] = clean;
      } else {
        col.push(clean);
      }
      persistStore();
      return attachSaveHelper(modelName, clean);
    },
    enumerable: false,
    configurable: true,
  });
  Object.defineProperty(doc, 'toObject', {
    value: function () {
      return clone(this);
    },
    enumerable: false,
    configurable: true,
  });
  return doc;
}

export class LocalModel<T extends PlainDoc = PlainDoc> {
  public modelName: string;
  public schema: mongoose.Schema;

  constructor(modelName: string, schema: mongoose.Schema) {
    this.modelName = modelName;
    this.schema = schema;
    modelRegistry.set(modelName, this);
  }

  rawFindById(id: string): PlainDoc | null {
    const col = getCollection(this.modelName);
    const found = col.find((d) => String(d._id) === String(id));
    return found ? clone(found) : null;
  }

  find(filter: PlainDoc = {}) {
    return new LocalQuery<T[]>(this.modelName, this.schema, filter, false);
  }

  findOne(filter: PlainDoc = {}) {
    return new LocalQuery<T | null>(this.modelName, this.schema, filter, true);
  }

  findById(id: string) {
    if (!id) return new LocalQuery<T | null>(this.modelName, this.schema, { _id: '__none__' }, true);
    return new LocalQuery<T | null>(this.modelName, this.schema, { _id: String(id) }, true);
  }

  async create(input: Partial<T> | Partial<T>[]): Promise<any> {
    const col = getCollection(this.modelName);
    if (Array.isArray(input)) {
      const created = input.map((item) => {
        const doc = applyDefaults(this.schema, item);
        col.push(doc);
        return attachSaveHelper(this.modelName, clone(doc));
      });
      persistStore();
      return created;
    }
    const doc = applyDefaults(this.schema, input);
    col.push(doc);
    persistStore();
    return attachSaveHelper(this.modelName, clone(doc));
  }

  async insertMany(inputs: Partial<T>[]): Promise<any[]> {
    return this.create(inputs);
  }

  async findByIdAndUpdate(id: string, update: PlainDoc, options: { new?: boolean } = {}) {
    const col = getCollection(this.modelName);
    const idx = col.findIndex((d) => String(d._id) === String(id));
    if (idx < 0) return null;
    const prev = clone(col[idx]);
    const next = applyUpdate(prev, update);
    col[idx] = next;
    persistStore();
    return attachSaveHelper(this.modelName, options.new !== false ? clone(next) : prev);
  }

  async findOneAndUpdate(filter: PlainDoc, update: PlainDoc, options: { new?: boolean; upsert?: boolean } = {}) {
    const col = getCollection(this.modelName);
    const idx = col.findIndex((d) => matchesFilter(d, filter));
    if (idx < 0) {
      if (options.upsert) {
        const base = applyDefaults(this.schema, { ...filter });
        const next = applyUpdate(base, update);
        col.push(next);
        persistStore();
        return attachSaveHelper(this.modelName, clone(next));
      }
      return null;
    }
    const prev = clone(col[idx]);
    const next = applyUpdate(prev, update);
    col[idx] = next;
    persistStore();
    return attachSaveHelper(this.modelName, options.new !== false ? clone(next) : prev);
  }

  async updateMany(filter: PlainDoc, update: PlainDoc) {
    const col = getCollection(this.modelName);
    let modified = 0;
    for (let i = 0; i < col.length; i++) {
      if (matchesFilter(col[i], filter)) {
        col[i] = applyUpdate(col[i], update);
        modified++;
      }
    }
    if (modified > 0) persistStore();
    return { modifiedCount: modified };
  }

  async findByIdAndDelete(id: string) {
    const col = getCollection(this.modelName);
    const idx = col.findIndex((d) => String(d._id) === String(id));
    if (idx < 0) return null;
    const [removed] = col.splice(idx, 1);
    persistStore();
    return clone(removed);
  }

  async deleteOne(filter: PlainDoc) {
    const col = getCollection(this.modelName);
    const idx = col.findIndex((d) => matchesFilter(d, filter));
    if (idx < 0) return { deletedCount: 0 };
    col.splice(idx, 1);
    persistStore();
    return { deletedCount: 1 };
  }

  async deleteMany(filter: PlainDoc = {}) {
    const col = getCollection(this.modelName);
    const before = col.length;
    state.collections[this.modelName] = col.filter((d) => !matchesFilter(d, filter));
    const deletedCount = before - state.collections[this.modelName].length;
    if (deletedCount > 0) persistStore();
    return { deletedCount };
  }

  async countDocuments(filter: PlainDoc = {}): Promise<number> {
    const col = getCollection(this.modelName);
    return col.filter((d) => matchesFilter(d, filter)).length;
  }
}
