-- Table: omop_vocab.domain

-- DROP TABLE IF EXISTS omop_vocab.domain;

CREATE TABLE IF NOT EXISTS omop_vocab.domain
(
    domain_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    domain_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    domain_concept_id integer NOT NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.domain
    OWNER to postgres;
-- Index: idx_domain_domain_id

-- DROP INDEX IF EXISTS omop_vocab.idx_domain_domain_id;

CREATE INDEX IF NOT EXISTS idx_domain_domain_id
    ON omop_vocab.domain USING btree
    (domain_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.domain
    CLUSTER ON idx_domain_domain_id;