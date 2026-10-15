import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class MovePositionDto {
  @ApiProperty({
    description: 'New 1-based position. Must be between 1 and the song count.',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  position: number;
}
