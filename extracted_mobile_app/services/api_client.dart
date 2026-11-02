import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';

import '../domain/models.dart';

/// NestJS/OpenAPI boundary. Demo mode never invokes this client.
/// Access tokens must come from the authenticated session, not a compile-time key.
class CommunityApiClient {
  CommunityApiClient({
    required String baseUrl,
    required Future<String?> Function() accessToken,
    Dio? transport,
  }) : dio = transport ?? Dio() {
    dio.options = BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
      contentType: 'application/json',
    );
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await accessToken();
          if (token != null) options.headers['Authorization'] = 'Bearer $token';
          handler.next(options);
        },
      ),
    );
  }
  final Dio dio;

  Future<List<VisitorEntry>> visitors(
    String communityId, {
    String? cursor,
  }) async {
    final response = await dio.get<Map<String, dynamic>>(
      '/v1/communities/$communityId/visitor-entries',
      queryParameters: {'cursor': ?cursor},
    );
    return (response.data!['items'] as List)
        .map((v) => VisitorEntry.fromJson(Map<String, dynamic>.from(v)))
        .toList();
  }

  Future<VisitorEntry> createVisitor(
    String communityId,
    Map<String, dynamic> body, {
    required String idempotencyKey,
  }) async {
    final response = await dio.post<Map<String, dynamic>>(
      '/v1/communities/$communityId/visitor-entries',
      data: body,
      options: Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
    return VisitorEntry.fromJson(response.data!);
  }

  Future<VisitorEntry> decide(
    String communityId,
    String entryId,
    bool approve,
  ) async {
    final response = await dio.post<Map<String, dynamic>>(
      '/v1/communities/$communityId/visitor-entries/$entryId/decision',
      data: {'decision': approve ? 'approved' : 'denied'},
    );
    return VisitorEntry.fromJson(response.data!);
  }

  Future<void> recordEntry(
    String communityId,
    String entryId, {
    required String idempotencyKey,
  }) => _transition(communityId, entryId, 'check-in', idempotencyKey);
  Future<void> recordExit(
    String communityId,
    String entryId, {
    required String idempotencyKey,
  }) => _transition(communityId, entryId, 'check-out', idempotencyKey);
  Future<void> _transition(
    String communityId,
    String id,
    String action,
    String key,
  ) async {
    await dio.post<void>(
      '/v1/communities/$communityId/visitor-entries/$id/$action',
      options: Options(headers: {'Idempotency-Key': key}),
    );
  }

  Future<void> registerDevice(String token, String platform) async => dio
      .post<void>('/v1/devices', data: {'token': token, 'platform': platform});
  static String newRequestKey() => const Uuid().v4();
  void close() => dio.close();
}
b