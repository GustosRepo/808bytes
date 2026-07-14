# Content Model

## Category
Fields:
- id (string)
- name (string)
- slug (string)
- description (string)
- accentColor (string)
- sortOrder (number)
- isActive (boolean)

## Product
Fields:
- id (string)
- title (string)
- slug (string)
- categoryId (string)
- type (enum: vst, pack, oneshot, merch)
- shortDescription (string)
- longDescription (string)
- isFree (boolean)
- price (number)
- currency (string)
- coverImageUrl (string)
- galleryImages (array of string)
- tags (array of string)
- fileFormat (string)
- compatibility (array of string)
- stockStatus (enum: in_stock, preorder, sold_out)
- checkoutLink (string)
- downloadLink (string)
- isFeatured (boolean)
- publishedAt (datetime)

## Cart Item
Fields:
- productId (string)
- title (string)
- unitPrice (number)
- quantity (number)
- lineTotal (number)

## Order
Fields:
- id (string)
- items (array of cart item)
- subtotal (number)
- tax (number)
- total (number)
- status (enum: pending, paid, failed, refunded)
- createdAt (datetime)

## Basic Validation Rules
- If isFree is true, price must be 0
- If isFree is false, checkoutLink is required
- If type is merch, include stockStatus
- If digital product, include fileFormat and compatibility
