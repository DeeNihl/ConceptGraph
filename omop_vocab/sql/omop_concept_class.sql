-- Table: omop_vocab.concept_class

-- DROP TABLE IF EXISTS omop_vocab.concept_class;

CREATE TABLE IF NOT EXISTS omop_vocab.concept_class
(
    concept_class_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    concept_class_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    concept_class_concept_id integer NOT NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.concept_class
    OWNER to postgres;
-- Index: idx_concept_class_class_id

-- DROP INDEX IF EXISTS omop_vocab.idx_concept_class_class_id;

CREATE INDEX IF NOT EXISTS idx_concept_class_class_id
    ON omop_vocab.concept_class USING btree
    (concept_class_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.concept_class
    CLUSTER ON idx_concept_class_class_id;