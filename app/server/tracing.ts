import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

const OTEL_EXPORTER_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger-collector:4318';

if (process.env.OTEL_LOG_LEVEL === 'debug') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'banking-app',
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${OTEL_EXPORTER_ENDPOINT}/v1/traces`,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-winston': { enabled: true },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown().catch(console.error).finally(() => process.exit(0));
});

export default sdk;