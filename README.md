# Entity sourcing

An experiment to make a universal REST backend based on event sourcing where events are stored in a simple text-file and played back as soon as the application restarts.
You can create rest resouces on the fly by simpely posting an entity to the supposed resouce.

E.g if you want to create a cars resource, then you can post the following message
```bash
> curl -H "Content-Type: application/json" -X POST -d '{"brand":"BMW","type":"320D"}' http://localhost:3000/api/v1/cars
```

Once an entity is created, it can be (partially updated) with a Post command
```bash
> curl -H "Content-Type: application/json" -X POST -d '{"brand":"BMW","type":"320D", "power":"139kW"}' http://localhost:3000/api/v1/cars/bc06f74c-dfff-46b1-8c82-00b3f4de71db
```

To delete an entity, it can be done by using the DELETE verb:
```bash
> curl -H "Content-Type: application/json" -X DELETE http://localhost:3000/api/v1/cars/bc06f74c-dfff-46b1-8c82-00b3f4de71db
```

## Retrieving
Entitys can be retrieved by a GET operation on the entity url:
```bash
> curl http://localhost:3000/api/v1/cars
```
Or
```bash
> curl http://localhost:3000/api/v1/cars/bc06f74c-dfff-46b1-8c82-00b3f4de71db
```
Query parameters are also supported. E.g.
```bash
> curl http://localhost:3000/api/v1/cars?brand=BMW
```
