-- Table: omop_vocab.vocabulary

-- DROP TABLE IF EXISTS omop_vocab.vocabulary;

CREATE TABLE IF NOT EXISTS omop_vocab.vocabulary
(
    vocabulary_id character varying(20) COLLATE pg_catalog."default" NOT NULL,
    vocabulary_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    vocabulary_reference character varying(255) COLLATE pg_catalog."default",
    vocabulary_version character varying(255) COLLATE pg_catalog."default",
    vocabulary_concept_id integer NOT NULL
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.vocabulary
    OWNER to postgres;
-- Index: idx_vocabulary_vocabulary_id

-- DROP INDEX IF EXISTS omop_vocab.idx_vocabulary_vocabulary_id;

CREATE INDEX IF NOT EXISTS idx_vocabulary_vocabulary_id
    ON omop_vocab.vocabulary USING btree
    (vocabulary_id COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS omop_vocab.vocabulary
    CLUSTER ON idx_vocabulary_vocabulary_id;