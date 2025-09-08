import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { VaultDataSchema } from '@/lib/contracts/vault';
import { requireAuth } from '@/lib/server/auth';
import { getVaultData } from '@/lib/server/vault/data';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    // Validate and coerce query params
    const QuerySchema = z.object({
      levels: z
        .union([z.literal('true'), z.literal('false')])
        .optional()
        .transform((v) => v === 'true'),
      exclude: z.string().optional(),
    });
    const q = QuerySchema.parse({
      levels: searchParams.get('levels') ?? undefined,
      exclude: searchParams.get('exclude') ?? undefined,
    });

    const excludeFolderId = q.exclude || undefined;
    const includeLevels = (q.levels ?? false) || !!excludeFolderId;

    const vaultData = await getVaultData(session.user.id, {
      includeHierarchy: true,
      includeLevels,
      excludeFolderId,
    });

    // Validate response shape for consistency
    const parsed = VaultDataSchema.parse(vaultData);
    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch vault tree',
      },
      { status: 500 }
    );
  }
}
