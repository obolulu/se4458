import { Controller, Get, Redirect } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  @ApiExcludeEndpoint()
  @Redirect('/api-docs')
  redirectToDocs(): void {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  health(): { status: string } {
    return { status: 'ok' };
  }
}
