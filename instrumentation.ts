/*instrumentation.ts*/
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from "@opentelemetry/sdk-metrics";
const { ZipkinExporter } = require("@opentelemetry/exporter-zipkin");

const zipkinExporter = new ZipkinExporter({
  serviceName: "my-awesome-service", // Replace with your actual service name
  url: "http://localhost:9411/api/v2/spans", // Zipkin server URL, adjust as needed
});

const sdk = new NodeSDK({
  traceExporter: zipkinExporter,
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  
});

sdk.start();
