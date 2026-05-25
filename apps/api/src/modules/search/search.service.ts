import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class SearchService {
  private client: MeiliSearch;

  constructor(private config: ConfigService) {
    this.client = new MeiliSearch({
      host: config.get<string>('MEILISEARCH_HOST', 'http://localhost:7700'),
      apiKey: config.get<string>('MEILI_KEY', 'masterKey'),
    });
  }

  async search(query: string, organizationId: string, indexes?: string[]) {
    const results: Record<string, unknown>[] = [];

    const targetIndexes = indexes || ['users', 'entities'];

    for (const indexName of targetIndexes) {
      try {
        const index = this.client.index(`${organizationId}_${indexName}`);
        const result = await index.search(query, { limit: 5 });
        results.push(...result.hits.map((hit) => ({ ...hit, _index: indexName })));
      } catch {
        // Index might not exist yet
      }
    }

    return { query, results };
  }

  async indexDocument(organizationId: string, indexName: string, document: Record<string, unknown>) {
    const index = this.client.index(`${organizationId}_${indexName}`);
    return index.addDocuments([document]);
  }

  async deleteDocument(organizationId: string, indexName: string, documentId: string) {
    const index = this.client.index(`${organizationId}_${indexName}`);
    return index.deleteDocument(documentId);
  }
}
