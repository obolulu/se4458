import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export const SORT_FIELDS = ['position', 'title', 'artist', 'duration'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export class QuerySongsDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive substring match on title, artist or album',
    example: 'weeknd',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive exact genre match',
    example: 'Pop',
  })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({
    description: '`true` returns only favorites, `false` only non-favorites',
    type: Boolean,
  })
  @IsOptional()
  // Map the query strings by hand: implicit conversion would turn "false" into true.
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  favorite?: boolean;

  @ApiPropertyOptional({ enum: SORT_FIELDS, default: 'position' })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: SortField;

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'asc' })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  order?: SortOrder;
}
