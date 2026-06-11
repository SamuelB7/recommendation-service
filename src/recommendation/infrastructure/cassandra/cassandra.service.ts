import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Client } from 'cassandra-driver';

@Injectable()
export class CassandraService implements OnModuleInit, OnModuleDestroy {
  private readonly keyspace = process.env.CASSANDRA_KEYSPACE ?? 'recommendation';
  private readonly client: Client;

  constructor() {
    const { contactPoints, port } = this.parseContactPoints(process.env.CASSANDRA_CONTACT_POINTS ?? 'localhost:9042');
    this.client = new Client({
      contactPoints,
      localDataCenter: process.env.CASSANDRA_LOCAL_DATACENTER ?? 'datacenter1',
      protocolOptions: { port }
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    await this.ensureSchema();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.shutdown();
  }

  execute(query: string, params: unknown[] = []) {
    return this.client.execute(query, params, { prepare: true });
  }

  table(name: string): string {
    return `${this.keyspace}.${name}`;
  }

  private async ensureSchema(): Promise<void> {
    await this.client.execute(
      `CREATE KEYSPACE IF NOT EXISTS ${this.keyspace}
       WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`
    );

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS ${this.table('recommendations_by_customer')} (
        customer_id text,
        score double,
        listing_id text,
        title text,
        category_id text,
        reason text,
        updated_at timestamp,
        PRIMARY KEY ((customer_id), score, listing_id)
      ) WITH CLUSTERING ORDER BY (score DESC)
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS ${this.table('related_products_by_listing')} (
        listing_id text,
        score double,
        related_listing_id text,
        title text,
        category_id text,
        reason text,
        updated_at timestamp,
        PRIMARY KEY ((listing_id), score, related_listing_id)
      ) WITH CLUSTERING ORDER BY (score DESC)
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS ${this.table('popular_products_by_category')} (
        category_id text,
        score double,
        listing_id text,
        title text,
        reason text,
        updated_at timestamp,
        PRIMARY KEY ((category_id), score, listing_id)
      ) WITH CLUSTERING ORDER BY (score DESC)
    `);

    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS ${this.table('listing_snapshots')} (
        listing_id text PRIMARY KEY,
        title text,
        category_id text,
        seller_id text,
        updated_at timestamp
      )
    `);
  }

  private parseContactPoints(value: string): { contactPoints: string[]; port: number } {
    const entries = value.split(',').map((entry) => entry.trim()).filter(Boolean);
    const firstPort = entries[0]?.split(':')[1];

    return {
      contactPoints: entries.map((entry) => entry.split(':')[0]),
      port: firstPort ? Number(firstPort) : 9042
    };
  }
}
