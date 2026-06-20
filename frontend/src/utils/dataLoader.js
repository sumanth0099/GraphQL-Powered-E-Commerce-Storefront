import { graphqlQuery } from "./graphqlClient.js";

/**
 * dataloader helps batch multiple load() calls into one query
 * fixes N+1 issue
 */
class DataLoader {
  constructor(batchFn) {
    this._batchFn = batchFn;
    this._queue = []; // { key, resolve, reject }
    this._scheduled = false;
  }

  load(key) {
    return new Promise((resolve, reject) => {
      // console.log("loading key:", key);
      this._queue.push({ key, resolve, reject });

      if (!this._scheduled) {
        this._scheduled = true;
        // Schedule batch processing after current event loop tick
        setTimeout(() => this._processBatch(), 0);
      }
    });
  }

  async _processBatch() {
    const batch = this._queue.splice(0);
    this._scheduled = false;

    if (batch.length === 0) return;

    const keys = batch.map((item) => item.key);
    // console.log("running batch with keys:", keys);

    try {
      const results = await this._batchFn(keys);
      batch.forEach(({ key, resolve, reject }) => {
        const result = results.find((r) => String(r.id) === String(key));
        if (result) {
          resolve(result);
        } else {
          reject(new Error(`No result found for key: ${key}`));
        }
      });
    } catch (err) {
      batch.forEach(({ reject }) => reject(err));
    }
  }
}

// singleton loader for products
const PRODUCTS_BY_IDS_QUERY = `
  query ProductsByIds($ids: [ID!]!) {
    productsByIds(ids: $ids) {
      id
      title
      price
      image
      category
    }
  }
`;

async function batchLoadProducts(ids) {
  const data = await graphqlQuery(PRODUCTS_BY_IDS_QUERY, { ids });
  return data.productsByIds;
}

export const productLoader = new DataLoader(batchLoadProducts);

// test function in console
if (typeof window !== "undefined") {
  window.triggerBatchFetch = () => {
    console.log("triggering batch fetch...");
    Promise.all([
      productLoader.load("1"),
      productLoader.load("2"),
      productLoader.load("3"),
    ]).then((results) => {
      console.log("got results from batch:", results);
    });
  };
}

export default DataLoader;
