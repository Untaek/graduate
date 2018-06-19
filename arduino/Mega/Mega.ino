#include <HX711.h>
#include <Servo.h>
#include <ArduinoJson.h>
#include <math.h>

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
long onehour = currentMillis;

Servo servo;
int servoPin = 12;
int angle = 0;

int pumpPin = 44;
int relayPin = 11;

const int SOUND = A8;

HX711 scale1;
HX711 scale2;
HX711 scale3;

int meal;
int water;
int weight;
int state;
char buf[100];

int value;

void initiateHX711(HX711 &scale, int a1, int a2, float cal) {
  scale.begin(a1, a2);
  Serial.println("Initializing the scale");

  scale.set_scale(cal);
  scale.tare();
}
//소리감지
void detectbark(){
  int bark = analogRead(SOUND);
  Serial.println(bark);
}

// 그릇 무게
int readWeight(HX711 scale, String name, int &target) {
  int temp = target;
  target = scale.get_units(10);
  if( fabsf(temp - target) > 10 ) {
    Serial.print("Event");
    Serial.print(fabsf(temp-target));
    state++;
  }
  Serial.println(name + " average:\t" + target);
  return state;
}

// 개 몸무게
int calculate(HX711 scale, String name, int &target) {
  target = scale.get_units(10);
  if(target) {
    Serial.println("PUPPY");
    state++;
  }
  return state;
}

// 밥량 조절
void controlMeal(int target){
  servo.write(0);
  while(1){
    int current = scale1.get_units(10);
    if((current >= target) ) {
      servo.write(0);
      break;
      }
    else {
      servo.write(180);
    } 
  }
  servo.write(0);
  Serial.println("Feed");
}

// 물량 조절
void controlWater(int target){
  if(water > target) {
    digitalWrite(relayPin, LOW);
  }
  else {
    digitalWrite(relayPin, HIGH);
    while(1){
      int current = scale2.get_units(10);
      if(current >= target) {
        digitalWrite(relayPin, LOW);
        break;
      }
    }
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
  initiateHX711(scale3, A4, A5, 200.0f);
}

void loop() {
  // put your main code here, to run repeatedly:
  currentMillis = millis();
  state = 0;
  // every 1s
  if(currentMillis > prevMillis + 1000){
    prevMillis = currentMillis;
    readWeight(scale1, "meal", meal);
    delay(500);
    readWeight(scale2, "water", water);

    calculate(scale3, "weight", weight);
    detectbark();

    scale1.power_down();
    scale2.power_down();
    scale1.power_up();
    scale2.power_up();
  }
    /**serialize a sensor data
   * json[0] = meal weight
   * json[1] = water weight
   * json[2] = dog weight */
  if( (currentMillis > onehour + 3600000) || state > 0) {
    onehour = currentMillis;
    DynamicJsonBuffer jsonBuffer;
    JsonObject& root = jsonBuffer.createObject();
    JsonArray& json = root.createNestedArray("p");
    json.add(meal);
    json.add(water);
    json.add(weight);
    
    root.printTo(buf, root.measureLength()+1);
    buf[root.measureLength()+1] = 0;
    Serial1.write(buf);
    Serial.println(buf);
    }
     controlWater(20);

  /* DEV Not working. maybe a weight to eat place in here */
  if(Serial1.available()) {
    StaticJsonBuffer<200> readBuffer;
    String buf = Serial1.readString();
    JsonObject& root = readBuffer.parseObject(buf);
 
    int i = root.get<int>("meal");
    Serial.println(i);
    Serial.println();   
    controlMeal(10);
    //controlWater(30);
  }
}