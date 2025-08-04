import { Kafka, CompressionTypes, CompressionCodecs } from "kafkajs";
import SnappyCodec from "kafkajs-snappy";

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;
const kafka = new Kafka({
  brokers: ["localhost:9092"],
  connectionTimeout: 3000,
  requestTimeout: 2500,
  retry: {
    initialRetryTime: 100,
    retries: 10,
  },
  clientId: "consumer",
});

const consumer = kafka.consumer({ groupId: "test-group" });

await consumer.connect();
await consumer.subscribe({ topic: "test-topic", fromBeginning: true });
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log(
      `Received message: ${message.value!.toString()} from topic: ${topic}`
    );
  },
});
