FORMAT: 1A
HOST: http://refsys.dar.kz/api/v1

# DarEcosystem Core

## Промо коды [/codes]

### Получить промо код [GET /codes/{entity_type}/{entity_id}]

+ Parameters

    + entity_type (String) - тип пользователя, например halvauser, creditonuser
    + entity_id (Integer) - идентификатор пользователя

+ Response 200 (application/json)

        {
            "code": "NWWBGYH11",
            "forward_points": 0,
            "backward_points": 0
        }

### Применить промокод [POST /codes/{entity_type}/{entity_id}/apply/{code}]

+ Parameters

    + entity_type (String) - тип пользователя, который вводит промо код, например, halvauser, creditonuser
    + entity_id (Integer) - идентификатор пользователя, который вводит промо код,
    + code (String) - промо код который ввел пользователь 

+ Response 200 (application/json)

    + Body

        {}
        