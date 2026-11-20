# Unduck

DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables all of DuckDuckGo's bangs to work, but much faster.

```
https://unduck.link?q=%s
```

## How is it that much faster?

DuckDuckGo does their redirects server side. Their DNS is...not always great. Result is that it often takes ages.

I solved this by doing all of the work client side. Once you've went to https://unduck.link once, the page is cache'd and will never need to be downloaded again. Your device does the redirects, not me.

The redirect code is inline in the HTML, with the 270 most popular bangs. Searches with one of those bangs, or with no bang, redirect before anything else loads. The other bangs need one cached file (`public/bangs-v2.txt`).

## Bangs

The bang list comes from DuckDuckGo. To update it, run `pnpm sync-bangs` and commit the result.

To add or override a bang, edit `scripts/custom-bangs.json` and run `pnpm sync-bangs`.
