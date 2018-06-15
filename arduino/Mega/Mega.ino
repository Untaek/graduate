#include <HX711.h>
#include <Servo.h>
#include <ArduinoJson.h>

#define GET_SENSORVALUE 1
#define CONTROL_MEAL 2
#define CONTROL_WATER 3

struct Data {
  String device_id;
  String sensor_type;
  int measured_value;
};

#define DATALEN sizeof(struct Data)

static struct Data sensorData;
static struct Data targetData;

long currentMillis = millis();
long prevMillis = currentMillis;

Servo servo;
int servoPin = 12;
int angle = 0;

int pumpPin = 44;
int relayPin = 11;

HX711 scale1;
HX711 scale2;

int meal;
int water;

char buf[100];

void initiateHX711(HX711 &scale, int a1, int a2, float cal) {
  scale.begin(a1, a2);
  Serial.println("Initializing the scale");

  scale.set_scale(cal);
  scale.tare();
}

void readWeight(HX711 scale, String name, int &target) {
  target = scale.get_units(10);
  Serial.println(name + " average:\t" + target);
}

// 밥량 조절
void controlMeal(int target){
  if (meal > target) {
    servo.write(0);
  }
  else {
    servo.write(180);
  }
}

// 물량 조절
void controlWater(int target){
  if(water > target) {
    digitalWrite(relayPin, LOW);
  }
  else {
    digitalWrite(relayPin, HIGH);
  }
}

void setup() {
  Serial.begin(115200);
  Serial1.begin(9600);
  pinMode(44, OUTPUT);
  pinMode(relayPin, OUTPUT);
  servo.attach(servoPin);
  servo.write(0);
  initiateHX711(scale1, A1, A0, 570.0f);
  initiateHX711(scale2, A3, A2, 520.0f);
}

void loop() {
  // put your main code here, to run repeatedly:
  currentMillis = millis();

  // every 1s
  if(currentMillis > prevMillis + 1000){
    prevMillis = currentMillis;
    readWeight(scale1, "meal", meal);
    delay(500);
    readWeight(scale2, "water", water);
  
    scale1.power_down();
    scale2.power_down();
    scale1.power_up();
    scale2.power_up();

    /**serialize a sensor data
     * json[0] = meal weight
     * json[1] = water weight
     * json[2] = dog weight */
    DynamicJsonBuffer jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
    JsonArray& json = root.createNestedArray("p");
    json.add(meal);
    json.add(water);

    root.printTo(buf, root.measureLength()+1);
    buf[root.measureLength()+1] = 0;
    Serial1.write(buf);
    Serial.println(buf);
  }
  controlMeal(100);
  controlWater(100);

  /* DEV Not working. maybe a weight to eat place in here */
  if(Serial1.available()) {
    
  }
}
