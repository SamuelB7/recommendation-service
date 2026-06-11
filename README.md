# recommendation-service

Responsible for personalized recommendations, related products, and merchandising feeds.

Recommendation read-model service built with NestJS, Cassandra, JWT validation, Kafka integration events, personalized feeds, related products, and popular category feeds.

## Project Origin

This microservice is part of the [ecommerce-eda](https://github.com/SamuelB7/ecommerce-eda) event-driven marketplace platform.

## Endpoints

- `GET /health`
- `POST /events/demo`
- `GET /recommendations/me`
- `GET /recommendations/customers/:customerId`
- `GET /recommendations/listings/:listingId/related`
- `GET /recommendations/categories/:categoryId/popular`

## Cassandra

The service creates the configured keyspace and derived read-model tables at startup.

Tables:

- `recommendations_by_customer`
- `related_products_by_listing`
- `popular_products_by_category`
- `listing_snapshots`

## Demo Topic

- `recommendation.demo.event.v1`

## Integration Events

Consumed:

- `catalog.listing.published.v1`
- `orders.order.created.v1`
- `search.product_viewed.v1`
- `analytics.behavior_aggregated.v1`
