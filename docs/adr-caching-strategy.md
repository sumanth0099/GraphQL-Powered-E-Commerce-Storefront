# Caching Strategy

**Date:** June 20, 2026

So for this project we weren't allowed to use Apollo Client or React Query, so I had to come up with my own caching strategy for the GraphQL responses on the frontend. 

## What I decided to do

I just used **React state as the cache**, using some custom hooks I made (`useProducts`, `useProductSearch`) and the `CartContext`.

### How it works

**Product list**  
My `useProducts` hook just keeps an array of the products we've fetched so far. When you click "load more", it just appends to the array. I don't really re-fetch anything we already loaded because the cursors keep track of where we are.

**Search results**  
For the search, `useProductSearch` just replaces the results every time you type something new (after the debounce). I didn't bother caching past searches because the fake store API doesn't have that many products anyway, so it's super fast.

**Cart**  
The cart state is kept in `CartContext`. When you add something, I do the optimistic update right away to make it look fast. If the server throws an error, it rolls back. I didn't save the cart to `localStorage`, so if you refresh the page you lose your cart. I figured that's fine for this demo.

**DataLoader**  
The dataloader batches requests using a timeout hack I learned, but it doesn't save the results for later. It just deduplicates the requests happening at the exact same time.

## Why not localStorage or Service Workers?

I thought about using `localStorage` so the cart doesn't disappear on refresh, but dealing with JSON parse/stringify and making sure the data isn't stale seemed like overkill for this assignment. Service workers are way too complicated for what we needed to do here.

## Stuff to keep in mind
- If you refresh, you start over. 
- In a real app, I'd probably just use Apollo Client since it does all of this caching automatically with the `__typename` and `id` stuff. But building it this way was a cool way to learn how the big libraries actually work under the hood.
