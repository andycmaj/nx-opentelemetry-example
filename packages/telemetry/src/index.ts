import {
  ConsoleSpanExporter,
  NodeTracerProvider,
} from '@opentelemetry/sdk-trace-node';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { Resource } from '@opentelemetry/resources';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import * as opentelemetry from '@opentelemetry/sdk-node';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { KafkaJsInstrumentation } from 'opentelemetry-instrumentation-kafkajs';
import { IncomingMessage } from 'http';

const exporter = new OTLPTraceExporter();
const sdk = new opentelemetry.NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.VERSION,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
      process.env.ENVRIONMENT,
  }),
  traceExporter: exporter,
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingRequestHook: (req: any) => {
        // Ignore spans from introspections.
        const isIntrospection = !!((req.body ?? '') as string).match(
          'IntrospectionQuery'
        );
        return isIntrospection;
      },
    }),
    new ExpressInstrumentation(),
    new GraphQLInstrumentation(),
    new PgInstrumentation(),
    new KafkaJsInstrumentation(),
  ],
});

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk
  .start()
  .then(() => console.log('Tracing initialized', exporter))
  .catch((error) => console.log('Error initializing tracing', error));
