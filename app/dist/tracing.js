"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const api_1 = require("@opentelemetry/api");
const OTEL_EXPORTER_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger-collector:4318';
if (process.env.OTEL_LOG_LEVEL === 'debug') {
    api_1.diag.setLogger(new api_1.DiagConsoleLogger(), api_1.DiagLogLevel.DEBUG);
}
const sdk = new sdk_node_1.NodeSDK({
    resource: new resources_1.Resource({
        [semantic_conventions_1.ATTR_SERVICE_NAME]: 'banking-app',
        [semantic_conventions_1.ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
        'deployment.environment': process.env.NODE_ENV || 'development',
    }),
    traceExporter: new exporter_trace_otlp_http_1.OTLPTraceExporter({
        url: `${OTEL_EXPORTER_ENDPOINT}/v1/traces`,
    }),
    instrumentations: [
        (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)({
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
exports.default = sdk;
//# sourceMappingURL=tracing.js.map