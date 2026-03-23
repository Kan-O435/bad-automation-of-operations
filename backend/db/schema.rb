# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_22_130003) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "admins", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email"
    t.string "name"
    t.string "password_digest"
    t.datetime "updated_at", null: false
  end

  create_table "league_group_entries", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "games_lost", default: 0, null: false
    t.integer "games_won", default: 0, null: false
    t.bigint "league_group_id", null: false
    t.integer "losses", default: 0, null: false
    t.integer "points_lost", default: 0, null: false
    t.integer "points_won", default: 0, null: false
    t.integer "rank"
    t.bigint "team_id", null: false
    t.datetime "updated_at", null: false
    t.integer "wins", default: 0, null: false
    t.index ["league_group_id", "team_id"], name: "index_league_group_entries_on_league_group_id_and_team_id", unique: true
    t.index ["league_group_id"], name: "index_league_group_entries_on_league_group_id"
    t.index ["team_id"], name: "index_league_group_entries_on_team_id"
  end

  create_table "league_groups", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "group_number", null: false
    t.string "name", null: false
    t.bigint "tournament_category_id", null: false
    t.datetime "updated_at", null: false
    t.index ["tournament_category_id"], name: "index_league_groups_on_tournament_category_id"
  end

  create_table "match_games", force: :cascade do |t|
    t.integer "away_score", null: false
    t.datetime "created_at", null: false
    t.integer "game_number", null: false
    t.integer "home_score", null: false
    t.bigint "match_id", null: false
    t.datetime "updated_at", null: false
    t.index ["match_id", "game_number"], name: "index_match_games_on_match_id_and_game_number", unique: true
    t.index ["match_id"], name: "index_match_games_on_match_id"
  end

  create_table "matches", force: :cascade do |t|
    t.bigint "away_source_group_id"
    t.integer "away_source_rank"
    t.bigint "away_team_id"
    t.integer "bracket_position"
    t.datetime "created_at", null: false
    t.bigint "home_source_group_id"
    t.integer "home_source_rank"
    t.bigint "home_team_id"
    t.bigint "league_group_id"
    t.bigint "loser_next_match_id"
    t.integer "match_type", null: false
    t.bigint "next_match_id"
    t.integer "phase", null: false
    t.integer "round", null: false
    t.datetime "scheduled_at"
    t.integer "status", default: 0, null: false
    t.bigint "tournament_category_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "winner_team_id"
    t.index ["away_source_group_id"], name: "index_matches_on_away_source_group_id"
    t.index ["away_team_id"], name: "index_matches_on_away_team_id"
    t.index ["home_source_group_id"], name: "index_matches_on_home_source_group_id"
    t.index ["home_team_id"], name: "index_matches_on_home_team_id"
    t.index ["league_group_id"], name: "index_matches_on_league_group_id"
    t.index ["next_match_id"], name: "index_matches_on_next_match_id"
    t.index ["tournament_category_id"], name: "index_matches_on_tournament_category_id"
    t.index ["winner_team_id"], name: "index_matches_on_winner_team_id"
  end

  create_table "team_members", force: :cascade do |t|
    t.string "affiliation"
    t.integer "age"
    t.datetime "created_at", null: false
    t.integer "gender_type", null: false
    t.string "name", null: false
    t.bigint "team_id", null: false
    t.datetime "updated_at", null: false
    t.index ["team_id"], name: "index_team_members_on_team_id"
    t.check_constraint "gender_type = ANY (ARRAY[0, 1])", name: "check_team_members_gender_type"
  end

  create_table "teams", force: :cascade do |t|
    t.string "affiliation"
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.integer "seed_number"
    t.bigint "tournament_category_id", null: false
    t.datetime "updated_at", null: false
    t.index ["tournament_category_id"], name: "index_teams_on_tournament_category_id"
  end

  create_table "tournament_categories", force: :cascade do |t|
    t.integer "advance_count"
    t.string "age_type", default: ""
    t.datetime "created_at", null: false
    t.integer "event_type", null: false
    t.integer "format_type", null: false
    t.integer "gender_type", null: false
    t.integer "group_count"
    t.integer "group_size"
    t.boolean "has_third_place", default: false
    t.integer "max_participants"
    t.string "rank", null: false
    t.bigint "tournament_id", null: false
    t.datetime "updated_at", null: false
    t.index ["tournament_id"], name: "index_tournament_categories_on_tournament_id"
  end

  create_table "tournament_days", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.date "day"
    t.bigint "tournament_id", null: false
    t.datetime "updated_at", null: false
    t.index ["tournament_id"], name: "index_tournament_days_on_tournament_id"
  end

  create_table "tournaments", force: :cascade do |t|
    t.bigint "admin_id", null: false
    t.datetime "created_at", null: false
    t.text "detail"
    t.string "title"
    t.datetime "updated_at", null: false
    t.index ["admin_id"], name: "index_tournaments_on_admin_id"
  end

  add_foreign_key "league_group_entries", "league_groups"
  add_foreign_key "league_group_entries", "teams"
  add_foreign_key "league_groups", "tournament_categories"
  add_foreign_key "match_games", "matches"
  add_foreign_key "matches", "league_groups"
  add_foreign_key "matches", "league_groups", column: "away_source_group_id"
  add_foreign_key "matches", "league_groups", column: "home_source_group_id"
  add_foreign_key "matches", "matches", column: "loser_next_match_id"
  add_foreign_key "matches", "matches", column: "next_match_id"
  add_foreign_key "matches", "teams", column: "away_team_id"
  add_foreign_key "matches", "teams", column: "home_team_id"
  add_foreign_key "matches", "teams", column: "winner_team_id"
  add_foreign_key "matches", "tournament_categories"
  add_foreign_key "team_members", "teams"
  add_foreign_key "teams", "tournament_categories"
  add_foreign_key "tournament_categories", "tournaments"
  add_foreign_key "tournament_days", "tournaments"
  add_foreign_key "tournaments", "admins"
end
